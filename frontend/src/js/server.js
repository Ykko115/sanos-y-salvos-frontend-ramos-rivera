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
    usuarioId: reporte.usuarioId ?? raw.usuarioId ?? md?.usuarioId ?? null,
    mascotaId: reporte.mascotaId ?? raw.mascotaId ?? md?.id ?? null,
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

  // Nota: las notificaciones de coincidencia por usuario se entregan vía
  // Kafka (coincidencia.nueva → sala del dueño) y el polling de la BD en el
  // frontend. Aquí ya NO se hace broadcast para no avisar a todos los usuarios.
  // Las coincidencias del mapa se sirven por GET /api/coincidencias.
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

// Registrar un nuevo reporte: solo dispara el recálculo de coincidencias
// para el mapa. NO se emite 'nuevo_reporte' a todos — esa notificación
// llegaba al panel de cada usuario conectado (no corresponde).
app.post('/api/notificar/nuevo-reporte', (req, res) => {
  setTimeout(pollCoincidencias, 3000);
  res.json({ ok: true });
});

// Endpoint legacy de reunión. La notificación real la entrega Kafka
// (mascota.reunida → sala del dueño). Aquí ya NO se hace broadcast.
app.post('/api/notificar/mascota-reunida', (req, res) => {
  res.json({ ok: true });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('[socket] cliente conectado:', socket.id);
  socket.on('join', (userId) => {
    if (userId) {
      socket.join(String(userId));
      console.log(`[socket] ${socket.id} entró a sala usuario:${userId}`);
    }
  });
  socket.on('disconnect', () => console.log('[socket] cliente desconectado:', socket.id));
});

// ── Kafka consumer (eventos en tiempo real desde mascotas service) ────────────
;(async () => {
  let KafkaClass;
  try { KafkaClass = require('kafkajs').Kafka; } catch { return; }

  const kafka = new KafkaClass({
    clientId: 'sanos-salvos-socket',
    brokers: ['localhost:29092'],
    retry: { retries: 5, initialRetryTime: 3000 },
    logLevel: 1, // solo errores
  });

  const consumer = kafka.consumer({ groupId: 'socket-notifier-group' });

  try {
    await consumer.connect();
    await consumer.subscribe({
      topics: ['coincidencia.nueva', 'mascota.perdida', 'mascota.encontrada', 'mascota.reunida'],
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const data = JSON.parse(message.value.toString());

          if (topic === 'coincidencia.nueva') {
            const payload = {
              tipo: 'nueva_coincidencia',
              titulo: '¡Nueva coincidencia encontrada!',
              mensaje: data.mensaje || `${data.porcentaje ?? '?'}% de coincidencia detectada`,
              mascota_id: data.mascotaIdPerdida || null,
              mascota_candidata_id: data.mascotaIdCandidata || null,
              porcentaje: data.porcentaje,
              timestamp: new Date().toISOString(),
              leida: false,
            };
            const userId = data.usuarioId;
            if (userId) {
              // Solo al dueño de la mascota perdida — nunca broadcast
              io.to(String(userId)).emit('nueva_coincidencia', payload);
              console.log(`[Kafka→Socket] coincidencia.nueva → usuario:${userId} (${data.porcentaje}%)`);
            } else {
              // Sin dueño identificable no se emite a nadie (evita avisar a todos).
              // El frontend igual la recibe vía polling de BD si le corresponde.
              console.log(`[Kafka→Socket] coincidencia.nueva sin usuarioId — no se emite`);
            }
          }

          if (topic === 'mascota.perdida' || topic === 'mascota.encontrada') {
            setTimeout(pollCoincidencias, 4000);
          }

          if (topic === 'mascota.reunida') {
            const payload = {
              tipo: 'mascota_reunida',
              titulo: '¡Mascota reunida con su familia!',
              mensaje: `${data.nombre || 'Tu mascota'} ha vuelto a casa.`,
              mascota_id: data.mascotaId || null,
              timestamp: new Date().toISOString(),
              leida: false,
            };
            const userId = data.usuarioId;
            if (userId) {
              // Solo al dueño de la mascota reunida — evita avisar a todos
              io.to(String(userId)).emit('mascota_reunida', payload);
              console.log(`[Kafka→Socket] mascota.reunida → usuario:${userId}`);
            }
            // Sin usuarioId (p.ej. la mascota encontrada) no se emite nada.
          }
        } catch { /* ignorar mensajes mal formados */ }
      },
    });

    console.log('[Kafka] Consumidor listo → coincidencia.nueva | mascota.perdida | mascota.encontrada | mascota.reunida');
  } catch (err) {
    console.warn('[Kafka] No disponible — notificaciones en tiempo real desactivadas:', err.message);
  }
})();

server.listen(PORT, () => {
  console.log(`\n[OK] Servidor Socket.io listo en http://localhost:${PORT}`);
  console.log(`     GET /api/coincidencias`);
  console.log(`     GET /api/reportes/resumen`);
  console.log(`     GET /api/reportes/exportar?formato=pdf|xlsx\n`);
});
