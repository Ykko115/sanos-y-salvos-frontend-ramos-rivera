import { useAppContext } from '../../context/AppContext';

const TAGS = {
  nueva_coincidencia: { label: 'Coincidencia', color: '#2d8a4e', bg: '#ecfdf5' },
  nuevo_reporte:      { label: 'Reporte',       color: '#3b82f6', bg: '#eff6ff' },
  mascota_reunida:    { label: 'Reunión',        color: '#2d8a4e', bg: '#ecfdf5' },
  alerta_refugio:     { label: 'Alerta',         color: '#f59e0b', bg: '#fff8e1' },
};

function fmtHora(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

export default function TabNotificaciones() {
  const { state, dispatch } = useAppContext();
  const { notificaciones } = state;

  const irCoincidencias = (n) => {
    dispatch({ type: 'MARCAR_LEIDA', payload: n.id });
    dispatch({ type: 'SET_TAB', payload: 'coincidencias' });
  };

  const marcarTodas = () => dispatch({ type: 'MARCAR_TODAS_LEIDAS' });

  if (!notificaciones.length) {
    return (
      <div className="tab-vacio">
        <span style={{ fontSize: '2.5rem' }}>🔔</span>
        <p>Sin notificaciones aún</p>
      </div>
    );
  }

  return (
    <div className="tab-notificaciones">
      {notificaciones.some((n) => !n.leida) && (
        <button className="btn-marcar-todas" onClick={marcarTodas}>
          Marcar todas como leídas
        </button>
      )}
      <ul className="notif-lista">
        {notificaciones.map((n) => {
          const tag = TAGS[n.tipo] || TAGS.nuevo_reporte;
          const esCoincidencia = n.tipo === 'nueva_coincidencia';
          return (
            <li
              key={n.id}
              className={`notif-item ${!n.leida ? 'notif-no-leida' : ''}`}
              onClick={() => (esCoincidencia ? irCoincidencias(n) : dispatch({ type: 'MARCAR_LEIDA', payload: n.id }))}
              style={{ cursor: esCoincidencia ? 'pointer' : 'default' }}
            >
              {!n.leida && <span className="notif-punto" />}
              <div className="notif-cuerpo">
                <div className="notif-cabecera">
                  <span
                    className="notif-tag"
                    style={{ color: tag.color, background: tag.bg }}
                  >
                    {tag.label}
                  </span>
                  <span className="notif-hora">{fmtHora(n.timestamp)}</span>
                </div>
                <strong className="notif-titulo">{n.titulo}</strong>
                <p className="notif-mensaje">{n.mensaje}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
