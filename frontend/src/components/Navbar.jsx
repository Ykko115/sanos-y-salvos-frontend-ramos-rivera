
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getToken } from '../js/auth';
import '../css/Navbar.css';


export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownUserOpen, setDropdownUserOpen] = useState(false);
  const [user, setUser] = useState(null); // user: { nombre, rol }
  const dropdownTimeoutRef = React.useRef(null);
  const dropdownUserTimeoutRef = React.useRef(null);

  // Efecto para cargar usuario desde localStorage/sessionStorage si existe
  // Puedes cambiar a sessionStorage si prefieres

  // Efecto para cargar usuario desde localStorage y escuchar cambios
  React.useEffect(() => {
    const cargarUsuario = () => {
      // getToken() decodifica el JWT, elimina localStorage si expiró y retorna null
      const token = getToken();
      if (!token) {
        setUser(null);
        return;
      }
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

    // También usar un timer para detectar cambios locales y expiración
    const interval = setInterval(cargarUsuario, 1000);

    return () => {
      window.removeEventListener('storage', cargarUsuario);
      clearInterval(interval);
    };
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };


  const navigate = useNavigate();
  const handleLogin = () => {
    setMenuOpen(false);
    navigate('/login', { state: { backgroundLocation: location } });
  };
  const handleRegister = () => {
    setMenuOpen(false);
    navigate('/registro', { state: { backgroundLocation: location } });
  };

  const handleRegistroMascota = () => {
    if (!user) {
      // Si no está logueado, redirigir a login
      setMenuOpen(false);
      navigate('/login', { state: { backgroundLocation: location } });
      return;
    }
    setMenuOpen(false);
    navigate('/registromascota', { state: { backgroundLocation: location } });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('usuario');
    setMenuOpen(false);
    setDropdownUserOpen(false);
    navigate('/');
  };

  const handleNavigatePerfil = () => {
    setMenuOpen(false);
    setDropdownUserOpen(false);
    navigate('/perfil');
  };

  const handleNavigateMascotas = () => {
    setMenuOpen(false);
    setDropdownUserOpen(false);
    navigate('/mis-mascotas');
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
      <div
        className="user-dropdown"
        onMouseEnter={() => {
          if (dropdownUserTimeoutRef.current) clearTimeout(dropdownUserTimeoutRef.current);
          setDropdownUserOpen(true);
        }}
        onMouseLeave={() => {
          dropdownUserTimeoutRef.current = setTimeout(() => setDropdownUserOpen(false), 300);
        }}
      >
        <button
          className="nav-link user-name btn-perfil"
          onClick={() => setDropdownUserOpen(!dropdownUserOpen)}
        >
          🛡️ Admin ▼
        </button>
        {dropdownUserOpen && (
          <div className="dropdown-user-menu">
            <button className="dropdown-user-item" onClick={() => { setDropdownUserOpen(false); navigate('/admin'); }}>
              🏠 Panel Admin
            </button>
            <button className="dropdown-user-item" onClick={() => { setDropdownUserOpen(false); navigate('/admin/usuarios'); }}>
              👥 Usuarios
            </button>
            <button className="dropdown-user-item" onClick={() => { setDropdownUserOpen(false); navigate('/admin/reportes'); }}>
              📋 Reportes
            </button>
            <button className="dropdown-user-item" onClick={() => { setDropdownUserOpen(false); navigate('/admin/mascotas'); }}>
              🐾 Mascotas
            </button>
            <div className="dropdown-divider"></div>
            <button className="dropdown-user-item logout-item" onClick={handleLogout}>
              🚪 Cerrar Sesión
            </button>
          </div>
        )}
      </div>
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
      <div 
        className="user-dropdown" 
        onMouseEnter={() => {
          if (dropdownUserTimeoutRef.current) clearTimeout(dropdownUserTimeoutRef.current);
          setDropdownUserOpen(true);
        }}
        onMouseLeave={() => {
          dropdownUserTimeoutRef.current = setTimeout(() => {
            setDropdownUserOpen(false);
          }, 300);
        }}
      >
        <button 
          className="nav-link user-name btn-perfil" 
          onClick={() => setDropdownUserOpen(!dropdownUserOpen)}
          title="Mi perfil"
        >
          👤 {nombreCompleto || user.user.email} ▼
        </button>
        {dropdownUserOpen && (
          <div className="dropdown-user-menu">
            <button 
              className="dropdown-user-item" 
              onClick={handleNavigatePerfil}
            >
              👤 Mi Perfil
            </button>
            <button 
              className="dropdown-user-item" 
              onClick={handleNavigateMascotas}
            >
              🐾 Mis Mascotas
            </button>
            <div className="dropdown-divider"></div>
            <button 
              className="dropdown-user-item logout-item" 
              onClick={handleLogout}
            >
              🚪 Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo d-flex align-items-center" style={{marginRight: '2rem'}}>
          <span className="logo-icon">🐾</span>
          <h1 className="m-0 ms-2" >
            <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
            SANOS Y SALVOS
            </Link>
            </h1>
        </div>

        <div
          className={
            `nav-menu${menuOpen ? ' active' : ''} ` +
            (menuOpen ? 'd-block ' : 'd-none ') +
            'd-md-block'
          }
        >
          <ul className="nav-list list-unstyled m-0">
            <li className="nav-item d-block d-md-none">
              <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
                Inicio
              </Link>
            </li>
            <li className="nav-item">
              <a href="#buscar" className="nav-link" onClick={() => setMenuOpen(false)}>
                Buscar Mascotas
              </a>
            </li>
            <li className="nav-item">
              <button className="nav-link" onClick={handleRegistroMascota} style={{background: 'none', border: 'none', cursor: 'pointer', padding: 0}}>
                Registrar Mascota
              </button>
            </li>
            <li className="nav-item">
              <a href="#contacto" className="nav-link" onClick={() => setMenuOpen(false)}>
                Contacto
              </a>
            </li>
            <li className="nav-item auth-buttons">
              {!user ? (
                <div 
                  className="auth-dropdown" 
                  onMouseEnter={() => {
                    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
                    setDropdownOpen(true);
                  }}
                  onMouseLeave={() => {
                    dropdownTimeoutRef.current = setTimeout(() => {
                      setDropdownOpen(false);
                    }, 500);
                  }}
                >
                  <button 
                    className="btn-auth-main"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    Hola, Inicia sesión ▼
                  </button>
                  {dropdownOpen && (
                    <div className="dropdown-menu">
                      <button 
                        className="dropdown-item" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogin();
                        }}
                      >
                        Inicia sesión
                      </button>
                      <button 
                        className="dropdown-item" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegister();
                        }}
                      >
                        Regístrate
                      </button>
                    </div>
                  )}
                </div>
              ) : authSection}
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
