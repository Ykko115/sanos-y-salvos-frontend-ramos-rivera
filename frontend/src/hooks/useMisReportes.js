import { useState, useEffect } from 'react';

function normalizeReporte(raw) {
  if (!raw) return null;
  const reporte = raw.reporte || raw;
  const mw = raw.mascota || null;
  const md = mw?.mascota || (mw && (mw.nombre || mw.especie) ? mw : null) || null;
  const usuarioWrapper = raw.usuario || mw?.usuario || null;
  const usuarioData = usuarioWrapper?.usuario || usuarioWrapper || null;
  const ubicacion = reporte.ubicacion || md?.ubicacion || raw.ubicacion || null;
  const id = reporte.id || raw.id || md?.id || reporte.reporteId || raw.reporteId || null;
  const usuarioId = reporte.usuarioId ?? reporte.usuario_id ?? md?.usuarioId ?? usuarioData?.id ?? null;
  const mascotaId = reporte.mascotaId ?? reporte.mascota_id ?? md?.id ?? null;
  return { ...reporte, ...(md || {}), id, ubicacion, usuario: usuarioData, reporte, mascota: md, usuarioId, mascotaId };
}

export function useMisReportes() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const { usuario, userId } = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('usuario') || 'null');
      const user = u?.user || null;
      return { usuario: user, userId: user?.id ?? null };
    } catch { return { usuario: null, userId: null }; }
  })();

  useEffect(() => {
    if (!userId) { setCargando(false); setReportes([]); return; }
    setCargando(true);

    // Fetch mascotas del usuario (para tener los nombres) y todos los reportes en paralelo
    Promise.all([
      fetch(`/api/usuario/${userId}/mascotas`)
        .then((r) => (r.ok ? r.json() : {}))
        .then((data) => (Array.isArray(data.mascotas) ? data.mascotas : Array.isArray(data) ? data : []))
        .catch(() => []),
      fetch('/api/reportes')
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ])
      .then(([mascotas, allReportes]) => {
        // Mapa id → mascota para búsqueda rápida
        const mascotaMap = {};
        mascotas.forEach((m) => { if (m?.id != null) mascotaMap[String(m.id)] = m; });

        // Normalizar y filtrar por usuarioId
        const todos = (Array.isArray(allReportes) ? allReportes : [])
          .map(normalizeReporte)
          .filter(Boolean)
          .filter((r) => String(r.usuarioId) === String(userId));

        // Inyectar nombre desde el mapa de mascotas si falta
        todos.forEach((r) => {
          const mascota = mascotaMap[String(r.mascotaId)];
          if (mascota) {
            if (!r.nombre || r.nombre === 'Sin nombre') r.nombre = mascota.nombre;
            if (!r.especie) r.especie = mascota.especie;
            if (!r.raza) r.raza = mascota.raza;
          }
        });

        // Ordenar por fecha desc
        todos.sort((a, b) => {
          const fa = new Date(a.fechaReporte || a.fecha || 0).getTime();
          const fb = new Date(b.fechaReporte || b.fecha || 0).getTime();
          return fb - fa;
        });

        // Deduplicar por mascotaId: conservar el reporte más reciente por mascota
        const vistos = new Set();
        const unicos = todos.filter((r) => {
          const key = String(r.mascotaId ?? r.id);
          if (vistos.has(key)) return false;
          vistos.add(key);
          return true;
        });

        setReportes(unicos);
        setCargando(false);
      })
      .catch(() => { setReportes([]); setCargando(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { reportes, cargando, usuario };
}
