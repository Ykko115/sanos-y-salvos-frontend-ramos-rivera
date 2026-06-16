import '../css/Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>🐾 SANOS Y SALVOS</h3>
          <p>Ayudamos a encontrar mascotas perdidas y conectar con sus familias.</p>
        </div>

        <div className="footer-section">
          <h4>Enlaces Rápidos</h4>
          <ul>
            <li>
              <a href="#inicio">Inicio</a>
            </li>
            <li>
              <a href="#buscar">Buscar Mascotas</a>
            </li>
            <li>
              <a href="#reportar">Reportar Mascota</a>
            </li>
            <li>
              <a href="#contacto">Contacto</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contacto</h4>
          <ul>
            <li>
              <a href="mailto:info@sanosysalvos.com">info@sanosysalvos.com</a>
            </li>
            <li>
              <a href="tel:+56912345678">+56 9 1234 5678</a>
            </li>
            <li>Santiago, Chile</li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Síguenos</h4>
          <div className="social-links">
            <a href="#facebook" aria-label="Facebook">
              📘
            </a>
            <a href="#instagram" aria-label="Instagram">
              📷
            </a>
            <a href="#twitter" aria-label="Twitter">
              𝕏
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          &copy; {currentYear} Sanos y Salvos. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
