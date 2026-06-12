import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAppContext } from '../context/AppContext';

export function useSocket() {
  const { dispatch } = useAppContext();
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io('/', {
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    const mkNotif = (data) => ({ ...data, id: `notif_${Date.now()}_${Math.random()}`, leida: false });

    socket.on('nueva_coincidencia', (data) => {
      dispatch({ type: 'ADD_NOTIFICACION', payload: mkNotif(data) });
      // Refetch de coincidencias se maneja via useCoincidencias polling
    });

    socket.on('nuevo_reporte', (data) => {
      dispatch({ type: 'ADD_NOTIFICACION', payload: mkNotif(data) });
    });

    socket.on('mascota_reunida', (data) => {
      dispatch({ type: 'ADD_NOTIFICACION', payload: mkNotif(data) });
      if (data.mascota_id) {
        dispatch({ type: 'MASCOTA_REUNIDA', payload: data.mascota_id });
      }
    });

    socket.on('alerta_refugio', (data) => {
      dispatch({ type: 'ADD_NOTIFICACION', payload: mkNotif(data) });
    });

    return () => {
      socket.off('nueva_coincidencia');
      socket.off('nuevo_reporte');
      socket.off('mascota_reunida');
      socket.off('alerta_refugio');
      socket.disconnect();
    };
  }, [dispatch]);

  return socketRef;
}
