import React, { useState } from 'react';
import '../css/Navbar.css';


export default function Navbar({ onLogin, onRegister }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null); // user: { nombre, rol }

  // Efecto para cargar usuario desde localStorage/sessionStorage si existe
  // Puedes cambiar a sessionStorage si prefieres

  // Efecto para cargar usuario desde localStorage y escuchar cambios
  React.useEffect(() => {
    const cargarUsuario = () => {
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        try {
          setUser(JSON.parse(usuarioGuardado));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    cargarUsuario();

    // Escuchar cambios en localStorage (de otras pestañas)
    window.addEventListener('storage', cargarUsuario);

    // También usar un timer para detectar cambios locales
    const interval = setInterval(cargarUsuario, 1000);

    return () => {
      window.removeEventListener('storage', cargarUsuario);
      clearInterval(interval);
    };
  }, []);

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
    setUser(null);
    localStorage.removeItem('usuario');
    setMenuOpen(false);
  };

  // Renderizado condicional de la sección de usuario
  let authSection;
  // Si no hay usuario logueado
  if (!user) {
    authSection = (
      <>
        <button className="btn-login" onClick={handleLogin}>
          Iniciar Sesión
        </button>
        <button className="btn-register" onClick={handleRegister}>
          Registrarse
        </button>
      </>
    );
  } else if (user.user && user.user.rol && user.user.rol.toLowerCase() === 'admin') {
    authSection = (
      <>
        <span className="nav-link user-role" tabIndex={-1}>Administración</span>
        <button className="nav-link btn-logout" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </>
    );
  } else if (user.user && user.user.rol && user.user.rol.toLowerCase() === 'user') {
    // Mostrar nombre completo si está disponible, si no el email
    let nombreCompleto = '';
    if (user.user.nombre && user.user.apellido) {
      nombreCompleto = `${user.user.nombre} ${user.user.apellido}`;
    } else if (user.user.nombre) {
      nombreCompleto = user.user.nombre;
    } else if (user.user.apellido) {
      nombreCompleto = user.user.apellido;
    }
    authSection = (
      <>
        <span className="nav-link user-name" tabIndex={-1}>{nombreCompleto || user.user.email}</span>
        <button className="nav-link btn-logout" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </>
    );
  }

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
              {authSection}
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
