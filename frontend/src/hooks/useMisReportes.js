import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

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
  const { state } = useAppContext();
  const { mascotasReunidas } = state;

  const { usuario, userId } = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('usuario') || 'null');
      const user = u?.user || null;
      return { usuario: user, userId: user?.id ?? null };
    } catch { return { usuario: null, userId: null }; }
  })();

  useEffect(() => {
    if (!userId) { setCargando(false); setReportes([]); return; }
    let activo = true;

    // Fetch mascotas del usuario (nombre + estado actual) y todos los reportes en paralelo
    const cargar = () => Promise.all([
      fetch(`/api/mascotas/usuario/${userId}`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch('/api/reportes')
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ])
      .then(([mascotas, allReportes]) => {
        if (!activo) return;
        // Mapa id → mascota con estado real (incluye REUNIDO)
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
            r._mascotaEstado = mascota.estado;
          }
        });

        // Ordenar por fecha desc
        todos.sort((a, b) => {
          const fa = new Date(a.fechaReporte || a.fecha || 0).getTime();
          const fb = new Date(b.fechaReporte || b.fecha || 0).getTime();
          return fb - fa;
        });

        // Deduplicar por mascotaId y excluir mascotas ya reunidas
        const vistos = new Set();
        const unicos = todos.filter((r) => {
          if (r._mascotaEstado === 'REUNIDO') return false;
          const key = String(r.mascotaId ?? r.id);
          if (vistos.has(key)) return false;
          vistos.add(key);
          return true;
        });

        if (activo) { setReportes(unicos); setCargando(false); }
      })
      .catch(() => { if (activo) { setReportes([]); setCargando(false); } });

    setCargando(true);
    cargar();
    const interval = setInterval(cargar, 10000); // refrescar tras reuniones/eliminaciones
    return () => { activo = false; clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Filtro instantáneo: ocultar reportes de mascotas marcadas como reunidas
  // en esta sesión, sin esperar al próximo poll.
  const reunidasSet = new Set((mascotasReunidas || []).map(String));
  const visibles = reportes.filter(
    (r) => !reunidasSet.has(String(r.mascotaId ?? r.id))
  );

  return { reportes: visibles, cargando, usuario };
}
