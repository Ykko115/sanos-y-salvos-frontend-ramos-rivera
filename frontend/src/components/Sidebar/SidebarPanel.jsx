import { useAppContext } from '../../context/AppContext';
import TabNotificaciones from './TabNotificaciones';
import TabCoincidencias from './TabCoincidencias';
import TabReporte from './TabReporte';
import TabMisReportes from './TabMisReportes';
import '../../css/Sidebar.css';

const TABS = [
  { id: 'notif',        label: 'Notificaciones', contador: (s) => s.notificaciones.filter((n) => !n.leida).length },
  { id: 'coincidencias',label: 'Coincidencias',  contador: (s) => s.coincidencias.length },
  { id: 'reporte',      label: 'Estadisticas',   contador: () => 0 },
  { id: 'mis-reportes', label: 'Mis Reportes',   contador: () => 0 },
];

export default function SidebarPanel() {
  const { state, dispatch } = useAppContext();
  const { sidebarAbierto, tabActivo } = state;

  const cambiarTab = (id) => dispatch({ type: 'SET_TAB', payload: id });
  const cerrar = () => dispatch({ type: 'CERRAR_SIDEBAR' });

  return (
    <>
      {/* Overlay oscuro */}
      {sidebarAbierto && (
        <div className="sidebar-overlay" onClick={cerrar} />
      )}

      <aside className={`sidebar-panel ${sidebarAbierto ? 'sidebar-abierto' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <h3>Panel</h3>
          <button className="sidebar-cerrar" onClick={cerrar} aria-label="Cerrar panel">×</button>
        </div>

        {/* Tabs */}
        <div className="sidebar-tabs">
          {TABS.map((tab) => {
            const count = tab.contador(state);
            return (
              <button
                key={tab.id}
                className={`sidebar-tab ${tabActivo === tab.id ? 'sidebar-tab-activo' : ''}`}
                onClick={() => cambiarTab(tab.id)}
              >
                {tab.label}
                {count > 0 && <span className="tab-badge">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Contenido */}
        <div className="sidebar-contenido">
          {tabActivo === 'notif'         && <TabNotificaciones />}
          {tabActivo === 'coincidencias' && <TabCoincidencias />}
          {tabActivo === 'reporte'       && <TabReporte />}
          {tabActivo === 'mis-reportes'  && <TabMisReportes />}
        </div>
      </aside>
    </>
  );
}
