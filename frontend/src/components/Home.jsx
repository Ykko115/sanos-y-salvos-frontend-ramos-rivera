import '../css/Home.css';
import { Link, useLocation } from 'react-router-dom';
import MapaInteractivo from './MapaInteractivo';

export default function Home() {
  const location = useLocation();
  const isLoggedIn = (() => {
    try { return !!JSON.parse(localStorage.getItem('usuario') || 'null')?.user; }
    catch { return false; }
  })();

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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <Link
              to="/nuevo-reporte"
              state={{ backgroundLocation: location }}
              className="btn btn-primary"
            >
              Nuevo Reporte
            </Link>
          </div>
          <MapaInteractivo />
        </div>
      </section>

      {!isLoggedIn && (
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
      )}
    </main>
  );
}
