import { useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';

export function useCoincidencias() {
  const { dispatch, state } = useAppContext();
  const { mascotasReunidas } = state;

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

  const fetch_ = useCallback(async () => {
    try {
      const usuarioId = obtenerUsuarioId();
      // Sin sesión no se muestran coincidencias generales
      if (!usuarioId) {
        dispatch({ type: 'SET_COINCIDENCIAS', payload: [] });
        return;
      }
      const res = await fetch('/api/coincidencias');
      if (!res.ok) return;
      const data = await res.json();
      const reunidasSet = new Set((mascotasReunidas || []).map(String));
      // Solo las coincidencias de MIS mascotas perdidas que no han sido confirmadas
      const propias = (data.coincidencias || []).filter(
        (c) =>
          String(c.mascota_perdida?.usuarioId) === String(usuarioId) &&
          !reunidasSet.has(String(c.mascota_perdida?.mascotaId)) &&
          !reunidasSet.has(String(c.mascota_encontrada?.mascotaId))
      );
      dispatch({ type: 'SET_COINCIDENCIAS', payload: propias });
    } catch {
      // Node server no disponible — coincidencias permanecen vacías
    }
  }, [dispatch, mascotasReunidas]);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 30000);
    return () => clearInterval(id);
  }, [fetch_]);
}
