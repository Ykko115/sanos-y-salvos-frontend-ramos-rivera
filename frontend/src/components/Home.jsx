import './Home.css';

export default function Home({ onLoginClick, onRegisterClick }) {
  return (
    <main className="home">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h2 className="hero-title">
              🐾 Bienvenido a <span className="highlight">Sanos y Salvos</span>
            </h2>
            <p className="hero-subtitle">
              Tu plataforma para buscar y reportar mascotas perdidas
            </p>
            <p className="hero-description">
              Ayudamos a reunir a las mascotas perdidas con sus familias.
              Únete a nuestra comunidad y sé parte del cambio.
            </p>

            <div className="hero-buttons">
              <button className="btn btn-primary" onClick={onLoginClick}>
                🔐 Iniciar Sesión
              </button>
              <button className="btn btn-secondary" onClick={onRegisterClick}>
                ➕ Crear Cuenta
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="features-container">
          <h2>¿Cómo Funciona?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Buscar Mascotas</h3>
              <p>
                Explora miles de reportes de mascotas perdidas y encuentra la
                tuya o ayuda a otros a encontrar la suya.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📢</div>
              <h3>Reportar Mascotas</h3>
              <p>
                Si perdiste tu mascota, crea un reporte detallado con fotos y
                descripción. Nuestra comunidad te ayudará.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Comunidad Activa</h3>
              <p>
                Únete a miles de personas comprometidas con el bienestar y la
                seguridad de los animales.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>100% Responsivo</h3>
              <p>
                Accede desde cualquier dispositivo. Tu mascota podría estar en
                cualquier lugar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>¿Tienes una Mascota Perdida?</h2>
          <p>
            No esperes más. Crea una cuenta y reporta tu mascota ahora mismo.
            Cada minuto cuenta.
          </p>
          <button className="btn btn-primary-large" onClick={onRegisterClick}>
            Comenzar Ahora
          </button>
        </div>
      </section>
    </main>
  );
}
