const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST', 'PUT'] } });

const PORT = 3001;
const SPRING_URL = 'http://localhost:8080';

// ── Haversine distance (km) ───────────────────────────────────────
function distanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// ── Normalize Spring Boot reporte ────────────────────────────────
function normalizarReporte(raw) {
  if (!raw) return null;
  const reporte = raw.reporte || raw;
  const mw = raw.mascota || null;
  const md =
    mw?.mascota ||
    (mw && (mw.nombre || mw.especie) ? mw : null) ||
    null;
  const ubicacion = reporte.ubicacion || md?.ubicacion || raw.ubicacion || null;
  const id = reporte.id || raw.id || md?.id || reporte.reporteId || null;

  return {
    id: String(id || `${Date.now()}_${Math.random()}`),
    nombre: reporte.nombre_mascota || md?.nombre || reporte.nombreMascota || 'Sin nombre',
    especie: (md?.especie || md?.tipo || reporte?.especie || '').toLowerCase(),
    raza: (md?.raza || reporte?.raza || '').toLowerCase(),
    color: (md?.color || reporte?.color || '').toLowerCase(),
    lat: ubicacion?.latitude ?? null,
    lng: ubicacion?.longitude ?? null,
    comuna: md?.comuna || ubicacion?.comuna || '',
    fecha: reporte?.fechaReporte || md?.fecha_perdida || null,
    estado: (reporte?.estado || md?.estado || raw.estado || '').toUpperCase(),
  };
}

// ── Scoring algorithm ─────────────────────────────────────────────
function calcularScore(perdida, encontrada) {
  let score = 0;
  const criterios = [];

  if (perdida.especie && encontrada.especie && perdida.especie === encontrada.especie) {
    score += 30; criterios.push('especie');
  }
  if (perdida.raza && encontrada.raza) {
    const a = perdida.raza, b = encontrada.raza;
    if (a === b || a.includes(b) || b.includes(a)) { score += 25; criterios.push('raza'); }
  }
  if (perdida.color && encontrada.color) {
    const a = perdida.color, b = encontrada.color;
    if (a === b || a.includes(b) || b.includes(a)) { score += 20; criterios.push('color'); }
  }
  if (perdida.lat != null && perdida.lng != null && encontrada.lat != null && encontrada.lng != null) {
    if (distanciaKm(perdida.lat, perdida.lng, encontrada.lat, encontrada.lng) <= 5) {
      score += 15; criterios.push('zona');
    }
  }
  if (perdida.fecha && encontrada.fecha) {
    const dias = Math.abs(new Date(perdida.fecha) - new Date(encontrada.fecha)) / 86400000;
    if (dias <= 15) { score += 10; criterios.push('fecha'); }
  }
  return { score, criterios };
}

// ── Compute resumen from reporte array ───────────────────────────
function computeResumen(data) {
  const empty = { total_perdidas: 0, total_encontradas: 0, total_refugio: 0, total_reunidas: 0, zona_mas_reportes: null, por_semana: [], por_zona: [] };
  if (!Array.isArray(data) || data.length === 0) return empty;
  const reportes = data.map(normalizarReporte).filter(Boolean);
  const zonaCounts = {};
  reportes.forEach((r) => { if (r.comuna) zonaCounts[r.comuna] = (zonaCounts[r.comuna] || 0) + 1; });
  const zonasSorted = Object.entries(zonaCounts).sort((a, b) => b[1] - a[1]);
  const ahora = new Date();
  const por_semana = Array.from({ length: 8 }, (_, i) => {
    const inicio = new Date(ahora);
    inicio.setDate(inicio.getDate() - 7 * (7 - i));
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 7);
    return reportes.filter((r) => { if (!r.fecha) return false; const f = new Date(r.fecha); return f >= inicio && f < fin; }).length;
  });
  return {
    total_perdidas:    reportes.filter((r) => r.estado === 'PERDIDO').length,
    total_encontradas: reportes.filter((r) => r.estado === 'ENCONTRADO').length,
    total_reunidas:    reportes.filter((r) => r.estado === 'REUNIDA').length,
    total_refugio:     0,
    zona_mas_reportes: zonasSorted[0]?.[0] || null,
    por_semana,
    por_zona: zonasSorted.slice(0, 5).map(([zona, count]) => ({ zona, count })),
  };
}

// ── Fetch + compute coincidencias ─────────────────────────────────
async function fetchCoincidencias() {
  try {
    const { data } = await axios.get(`${SPRING_URL}/api/reportes`, { timeout: 5000 });
    if (!Array.isArray(data) || data.length === 0) return [];

    const reportes = data.map(normalizarReporte).filter(Boolean);
    const perdidas = reportes.filter((r) => r.estado === 'PERDIDO');
    const encontradas = reportes.filter((r) => r.estado === 'ENCONTRADO');
    const coincidencias = [];

    for (const p of perdidas) {
      for (const e of encontradas) {
        const { score, criterios } = calcularScore(p, e);
        if (score >= 60) {
          coincidencias.push({ id: `match_${p.id}_${e.id}`, score, criterios, mascota_perdida: p, mascota_encontrada: e });
        }
      }
    }
    coincidencias.sort((a, b) => b.score - a.score);
    return coincidencias;
  } catch {
    return [];
  }
}

// ── Auto-polling for new coincidencias ───────────────────────────
const vistos = new Set();
let primerPoll = true;

async function pollCoincidencias() {
  const coincidencias = await fetchCoincidencias();
  const nuevas = coincidencias.filter((c) => !vistos.has(c.id));
  nuevas.forEach((c) => vistos.add(c.id));

  if (!primerPoll && nuevas.length) {
    nuevas.forEach((c) => {
      io.emit('nueva_coincidencia', {
        tipo: 'nueva_coincidencia',
        titulo: '¡Nueva coincidencia encontrada!',
        mensaje: `${c.mascota_perdida.nombre} coincide ${c.score}% con mascota encontrada en ${c.mascota_encontrada.comuna || 'zona cercana'}`,
        mascota_id: c.mascota_perdida.id,
        timestamp: new Date().toISOString(),
        leida: false,
        coincidencia: c,
      });
    });
  }
  primerPoll = false;
}

pollCoincidencias();
setInterval(pollCoincidencias, 20000);

// ── REST endpoints ────────────────────────────────────────────────

app.get('/api/coincidencias', async (req, res) => {
  const coincidencias = await fetchCoincidencias();
  res.json({ coincidencias });
});

app.get('/api/reportes/resumen', async (req, res) => {
  try {
    const { data } = await axios.get(`${SPRING_URL}/api/reportes`, { timeout: 5000 });
    res.json(computeResumen(data));
  } catch {
    res.json(computeResumen([]));
  }
});

app.get('/api/reportes/exportar', async (req, res) => {
  const { formato = 'pdf' } = req.query;
  let resumen = computeResumen([]);
  try {
    const { data } = await axios.get(`${SPRING_URL}/api/reportes`, { timeout: 5000 });
    resumen = computeResumen(data);
  } catch { /* usa resumen vacío */ }

  if (formato === 'pdf') {
    try {
      const PdfPrinter = require('pdfmake');
      const { vfs } = require('pdfmake/build/vfs_fonts');
      const printer = new PdfPrinter({
        Roboto: {
          normal: Buffer.from(vfs['Roboto-Regular.ttf'], 'base64'),
          bold: Buffer.from(vfs['Roboto-Medium.ttf'], 'base64'),
          italics: Buffer.from(vfs['Roboto-Italic.ttf'], 'base64'),
          bolditalics: Buffer.from(vfs['Roboto-MediumItalic.ttf'], 'base64'),
        },
      });
      const docDef = {
        content: [
          { text: 'Sanos y Salvos — Reporte de Mascotas', style: 'header' },
          { text: `Generado: ${new Date().toLocaleDateString('es-CL')}`, margin: [0, 4, 0, 16] },
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto'],
              body: [
                [{ text: 'Metrica', bold: true }, { text: 'Valor', bold: true }],
                ['Total Perdidas',    resumen.total_perdidas],
                ['Total Encontradas', resumen.total_encontradas],
                ['Total Reunidas',    resumen.total_reunidas],
                ['Zona con mas reportes', resumen.zona_mas_reportes || '—'],
              ],
            },
          },
        ],
        styles: { header: { fontSize: 18, bold: true, color: '#2d8a4e', margin: [0, 0, 0, 8] } },
        defaultStyle: { font: 'Roboto' },
      };
      const doc = printer.createPdfKitDocument(docDef);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="reporte-sanos-salvos.pdf"');
      doc.pipe(res);
      doc.end();
    } catch {
      res.status(500).json({ error: 'Error generando PDF. Instala pdfmake: npm install pdfmake' });
    }
    return;
  }

  if (formato === 'xlsx') {
    try {
      const XLSX = require('xlsx');
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ['Metrica', 'Valor'],
        ['Total Perdidas',    resumen.total_perdidas],
        ['Total Encontradas', resumen.total_encontradas],
        ['Total Reunidas',    resumen.total_reunidas],
        ['Zona con mas reportes', resumen.zona_mas_reportes || '—'],
        [],
        ['Semana', 'Reportes'],
        ...resumen.por_semana.map((v, i) => [`Semana ${i + 1}`, v]),
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="reporte-sanos-salvos.xlsx"');
      res.send(buf);
    } catch {
      res.status(500).json({ error: 'Error generando Excel. Instala xlsx: npm install xlsx' });
    }
    return;
  }

  res.status(400).json({ error: 'Formato no soportado. Usa pdf o xlsx.' });
});

// Trigger socket events from frontend
app.post('/api/notificar/nuevo-reporte', (req, res) => {
  const { mascota } = req.body || {};
  io.emit('nuevo_reporte', {
    tipo: 'nuevo_reporte',
    titulo: 'Nuevo reporte registrado',
    mensaje: `Se registró un avistamiento${mascota?.nombre ? ` de ${mascota.nombre}` : ''}`,
    mascota_id: mascota?.id || null,
    timestamp: new Date().toISOString(),
    leida: false,
  });
  setTimeout(pollCoincidencias, 3000);
  res.json({ ok: true });
});

app.post('/api/notificar/mascota-reunida', (req, res) => {
  const { coincidenciaId, mascotaId } = req.body || {};
  io.emit('mascota_reunida', {
    tipo: 'mascota_reunida',
    titulo: '¡Mascota reunida con su familia!',
    mensaje: 'Una mascota ha sido reunida con su familia.',
    mascota_id: mascotaId || null,
    coincidencia_id: coincidenciaId || null,
    timestamp: new Date().toISOString(),
    leida: false,
  });
  res.json({ ok: true });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('[socket] cliente conectado:', socket.id);
  socket.on('disconnect', () => console.log('[socket] cliente desconectado:', socket.id));
});

server.listen(PORT, () => {
  console.log(`\n[OK] Servidor Socket.io listo en http://localhost:${PORT}`);
  console.log(`     GET /api/coincidencias`);
  console.log(`     GET /api/reportes/resumen`);
  console.log(`     GET /api/reportes/exportar?formato=pdf|xlsx\n`);
});
