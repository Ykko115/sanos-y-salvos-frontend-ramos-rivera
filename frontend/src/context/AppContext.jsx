import { createContext, useContext, useReducer } from 'react';

const AppContext = createContext(null);

const initialState = {
  mascotas: [],
  coincidencias: [],
  notificaciones: [],
  tabActivo: 'notif',
  sidebarAbierto: false,
  totalReportadas: 0,
  mascotasReunidas: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_MASCOTAS':
      return { ...state, mascotas: action.payload, totalReportadas: action.payload.length };

    case 'SET_COINCIDENCIAS':
      return { ...state, coincidencias: action.payload };

    case 'ADD_NOTIFICACION':
      return { ...state, notificaciones: [action.payload, ...state.notificaciones].slice(0, 50) };

    case 'MARCAR_LEIDA':
      return {
        ...state,
        notificaciones: state.notificaciones.map((n) =>
          n.id === action.payload ? { ...n, leida: true } : n
        ),
      };

    case 'MARCAR_TODAS_LEIDAS':
      return { ...state, notificaciones: state.notificaciones.map((n) => ({ ...n, leida: true })) };

    case 'SET_TAB':
      return { ...state, tabActivo: action.payload };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarAbierto: !state.sidebarAbierto };

    case 'ABRIR_SIDEBAR':
      return { ...state, sidebarAbierto: true };

    case 'CERRAR_SIDEBAR':
      return { ...state, sidebarAbierto: false };

    case 'QUITAR_COINCIDENCIA':
      return {
        ...state,
        coincidencias: state.coincidencias.filter((c) => c.id !== action.payload),
      };

    case 'MASCOTA_REUNIDA':
      return {
        ...state,
        mascotasReunidas: [...state.mascotasReunidas, String(action.payload)],
        coincidencias: state.coincidencias.filter(
          (c) =>
            String(c.mascota_perdida.id) !== String(action.payload) &&
            String(c.mascota_encontrada.id) !== String(action.payload)
        ),
      };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext debe usarse dentro de AppProvider');
  return ctx;
}
