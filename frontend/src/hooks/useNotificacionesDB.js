import { useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

export function useNotificacionesDB() {
  const { dispatch } = useAppContext();
  const yaAgregadasRef = useRef(new Set());

  useEffect(() => {
    const obtenerUsuarioId = () => {
      try {
        const raw = localStorage.getItem('usuario');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.user?.id ?? parsed?.id ?? null;
      } catch {
        return null;
      }
    };

    const obtenerToken = () => {
      try {
        const parsed = JSON.parse(localStorage.getItem('usuario') || 'null');
        return parsed?.token ?? null;
      } catch { return null; }
    };

    const poll = async () => {
      const usuarioId = obtenerUsuarioId();
      if (!usuarioId) return;
      const token = obtenerToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      try {
        const res = await fetch(`/api/mascotas/notificaciones/${usuarioId}`, { headers });
        if (!res.ok) return;
        const notifs = await res.json();
        // Una notif por mascota encontrada (candidata) — la de mayor porcentaje
        const mejorPorCandidata = new Map();
        notifs.forEach((n) => {
          const prev = mejorPorCandidata.get(n.mascotaIdCandidata);
          if (!prev || (n.porcentaje ?? 0) > (prev.porcentaje ?? 0)) {
            mejorPorCandidata.set(n.mascotaIdCandidata, n);
          }
        });
        mejorPorCandidata.forEach((n) => {
          if (n.leida) return;
          const key = `db_${n.id}`;
          if (!yaAgregadasRef.current.has(key)) {
            yaAgregadasRef.current.add(key);
            dispatch({
              type: 'ADD_NOTIFICACION',
              payload: {
                id: key,
                tipo: 'nueva_coincidencia',
                titulo: '¡Nueva coincidencia encontrada!',
                mensaje: n.mensaje || `Tu mascota tiene ${n.porcentaje ?? '?'}% de coincidencia con una mascota encontrada`,
                mascota_id: n.mascotaIdPerdida,
                mascotaIdPerdida: n.mascotaIdPerdida,
                mascotaIdCandidata: n.mascotaIdCandidata,
                porcentaje: n.porcentaje ?? 0,
                timestamp: n.fechaNotificacion,
                leida: n.leida ?? false,
                _dbId: n.id,
              },
            });
          }
        }); // end forEach mejorPorCandidata
      } catch {
        // backend no disponible — silencioso
      }
    };

    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [dispatch]);
}
