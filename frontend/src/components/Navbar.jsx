import { useState } from 'react';
import '../css/Navbar.css';

export default function Navbar({ onLogin, onRegister }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLogin = () => {
    setMenuOpen(false);
    onLogin();
  };

  const handleRegister = () => {
    setMenuOpen(false);
    onRegister();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <span className="logo-icon">🐾</span>
          <h1>SANOS Y SALVOS</h1>
        </div>

        <div className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          <ul className="nav-list">
            <li className="nav-item">
              <a href="#inicio" className="nav-link">
                Inicio
              </a>
            </li>
            <li className="nav-item">
              <a href="#buscar" className="nav-link">
                Buscar Mascotas
              </a>
            </li>
            <li className="nav-item">
              <a href="#reportar" className="nav-link">
                Reportar Mascota
              </a>
            </li>
            <li className="nav-item">
              <a href="#contacto" className="nav-link">
                Contacto
              </a>
            </li>
            <li className="nav-item auth-buttons">
              {!isLoggedIn ? (
                <>
                  <button className="btn-login" onClick={handleLogin}>
                    Iniciar Sesión
                  </button>
                  <button className="btn-register" onClick={handleRegister}>
                    Registrarse
                  </button>
                </>
              ) : (
                <button className="btn-logout" onClick={handleLogout}>
                  Cerrar Sesión
                </button>
              )}
            </li>
          </ul>
        </div>

        <div className="hamburger" onClick={toggleMenu}>
          <span className={`bar ${menuOpen ? 'active' : ''}`}></span>
          <span className={`bar ${menuOpen ? 'active' : ''}`}></span>
          <span className={`bar ${menuOpen ? 'active' : ''}`}></span>
        </div>
      </div>
    </nav>
  );
}
