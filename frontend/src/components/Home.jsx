import '../css/Home.css';
import { Link, useLocation } from 'react-router-dom';
import MapaInteractivo from './MapaInteractivo';
import SidebarPanel from './Sidebar/SidebarPanel';
import { useAppContext } from '../context/AppContext';
import { useCoincidencias } from '../hooks/useCoincidencias';

function BtnSidebar() {
  const { state, dispatch } = useAppContext();
  const noLeidas = state.notificaciones.filter((n) => !n.leida).length;
  const coincidencias = state.coincidencias.length;
  const total = noLeidas + coincidencias;

  const abrir = () => {
    dispatch({ type: 'ABRIR_SIDEBAR' });
    dispatch({ type: 'SET_TAB', payload: noLeidas > 0 ? 'notif' : 'coincidencias' });
  };

  return (
    <button className="btn-sidebar-toggle" onClick={abrir}>
      🔔 Panel
      {total > 0 && <span className="btn-sidebar-badge">{total}</span>}
    </button>
  );
}

function MapaConSidebar() {
  useCoincidencias();
  return (
    <>
      <MapaInteractivo />
      <SidebarPanel />
    </>
  );
}

export default function Home() {
  const location = useLocation();

  return (
    <main className="home">
      <section className="hero-section bg-light py-5">
        <div className="container">
          <div className="row align-items-center justify-content-center">
            <div className="col-12 col-md-10 col-lg-8 text-center">
              <h2 className="hero-title display-5 fw-bold mb-3">
                🐾 Bienvenido a <span className="highlight">Sanos y Salvos</span>
              </h2>
              <p className="hero-subtitle lead mb-2">
                Tu plataforma para buscar y reportar mascotas perdidas
              </p>
              <p className="hero-description mb-4">
                Ayudamos a reunir a las mascotas perdidas con sus familias.<br className="d-none d-md-block" />
                Únete a nuestra comunidad y sé parte del cambio.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mapa-section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1rem' }}>
            <BtnSidebar />
            <Link
              to="/nuevo-reporte"
              state={{ backgroundLocation: location }}
              className="btn btn-primary"
            >
              Nuevo Reporte
            </Link>
          </div>
          <MapaConSidebar />
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>¿Tienes una Mascota Perdida?</h2>
          <p>
            No esperes más. Crea una cuenta y reporta tu mascota ahora mismo.
            Cada minuto cuenta.
          </p>
          <Link
            to="/registro"
            state={{ backgroundLocation: location }}
            className="btn btn-primary-large"
          >
            Comenzar Ahora
          </Link>
        </div>
      </section>
    </main>
  );
}
