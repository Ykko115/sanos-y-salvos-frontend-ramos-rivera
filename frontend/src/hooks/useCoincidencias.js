import { useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';

export function useCoincidencias() {
  const { dispatch } = useAppContext();

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/coincidencias');
      if (!res.ok) return;
      const data = await res.json();
      dispatch({ type: 'SET_COINCIDENCIAS', payload: data.coincidencias || [] });
    } catch {
      // Node server no disponible — coincidencias permanecen vacías
    }
  }, [dispatch]);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 30000);
    return () => clearInterval(id);
  }, [fetch_]);
}
