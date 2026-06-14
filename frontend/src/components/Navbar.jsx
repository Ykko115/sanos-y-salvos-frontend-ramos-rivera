import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useCoincidencias } from '../hooks/useCoincidencias';
import { useNotificacionesDB } from '../hooks/useNotificacionesDB';
import TabNotificaciones from './Sidebar/TabNotificaciones';
import TabCoincidencias from './Sidebar/TabCoincidencias';
import TabReporte from './Sidebar/TabReporte';
import TabMisReportes from './Sidebar/TabMisReportes';
import '../css/Navbar.css';
import '../css/Sidebar.css';

const PANEL_TABS = [
  { id: 'notif',         label: 'Notificaciones', contador: (s) => s.notificaciones.filter((n) => !n.leida).length },
  { id: 'coincidencias', label: 'Coincidencias',  contador: (s) => s.coincidencias.length },
  { id: 'reporte',       label: 'Estadísticas',   contador: () => 0 },
  { id: 'mis-reportes',  label: 'Mis Reportes',   contador: () => 0 },
];

function NavPanel() {
  const { state, dispatch } = useAppContext();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!state.sidebarAbierto) return;
    const handler = (e) => {
      if (e.target.closest('[data-portal-modal]')) return;
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        dispatch({ type: 'CERRAR_SIDEBAR' });
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [state.sidebarAbierto, dispatch]);

  const noLeidas = state.notificaciones.filter((n) => !n.leida).length;
  const totalBadge = noLeidas + state.coincidencias.length;

  return (
    <div className="nav-panel-wrapper" ref={panelRef}>
      <button
        className="nav-bell-btn"
        onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        aria-label="Notificaciones y panel"
      >
        🔔
        {totalBadge > 0 && <span className="nav-bell-badge">{totalBadge}</span>}
      </button>

      {state.sidebarAbierto && (
        <div className="nav-panel-dropdown">
          <div className="nav-panel-header">
            <span>Panel</span>
            <button className="nav-panel-cerrar" onClick={() => dispatch({ type: 'CERRAR_SIDEBAR' })}>×</button>
          </div>
          <div className="nav-panel-tabs">
            {PANEL_TABS.map((tab) => {
              const count = tab.contador(state);
              return (
                <button
                  key={tab.id}
                  className={`nav-panel-tab ${state.tabActivo === tab.id ? 'nav-panel-tab-activo' : ''}`}
                  onClick={() => dispatch({ type: 'SET_TAB', payload: tab.id })}
                >
                  {tab.label}
                  {count > 0 && <span className="tab-badge">{count}</span>}
                </button>
              );
            })}
          </div>
          <div className="nav-panel-contenido">
            {state.tabActivo === 'notif'         && <TabNotificaciones />}
            {state.tabActivo === 'coincidencias' && <TabCoincidencias />}
            {state.tabActivo === 'reporte'       && <TabReporte />}
            {state.tabActivo === 'mis-reportes'  && <TabMisReportes />}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownUserOpen, setDropdownUserOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownTimeoutRef = useRef(null);
  const dropdownUserTimeoutRef = useRef(null);

  useCoincidencias();
  useNotificacionesDB();

  useEffect(() => {
    const cargarUsuario = () => {
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        try {
          const usuario = JSON.parse(usuarioGuardado);
          if (usuario.exp && Date.now() / 1000 > usuario.exp) {
            localStorage.removeItem('usuario');
            setUser(null);
          } else {
            setUser(usuario);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    cargarUsuario();
    window.addEventListener('storage', cargarUsuario);
    const interval = setInterval(cargarUsuario, 1000);
    return () => {
      window.removeEventListener('storage', cargarUsuario);
      clearInterval(interval);
    };
  }, []);

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
    // Recarga limpia: resetea notificaciones/coincidencias del estado y saca
    // al socket de la sala del usuario anterior. Evita que el siguiente
    // usuario vea notificaciones que no son suyas.
    window.location.assign('/');
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

  let authSection;
  if (!user) {
    authSection = (
      <>
        <button className="btn-login" onClick={handleLogin}>Iniciar Sesión</button>
        <button className="btn-register" onClick={handleRegister}>Registrarse</button>
      </>
    );
  } else if (user.user?.rol?.toLowerCase() === 'admin') {
    authSection = (
      <>
        <span className="nav-link user-role" tabIndex={-1}>Administración</span>
        <button className="nav-link btn-logout" onClick={handleLogout}>Cerrar Sesión</button>
      </>
    );
  } else if (user.user?.rol?.toLowerCase() === 'user') {
    let nombreCompleto = '';
    if (user.user.nombre && user.user.apellido) nombreCompleto = `${user.user.nombre} ${user.user.apellido}`;
    else if (user.user.nombre) nombreCompleto = user.user.nombre;
    else if (user.user.apellido) nombreCompleto = user.user.apellido;

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
        <button className="nav-link user-name btn-perfil" onClick={() => setDropdownUserOpen(!dropdownUserOpen)}>
          👤 {nombreCompleto || user.user.email} ▼
        </button>
        {dropdownUserOpen && (
          <div className="dropdown-user-menu">
            <button className="dropdown-user-item" onClick={handleNavigatePerfil}>👤 Mi Perfil</button>
            <button className="dropdown-user-item" onClick={handleNavigateMascotas}>🐾 Mis Mascotas</button>
            <div className="dropdown-divider"></div>
            <button className="dropdown-user-item logout-item" onClick={handleLogout}>🚪 Cerrar Sesión</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo d-flex align-items-center" style={{ marginRight: '2rem' }}>
          <span className="logo-icon">🐾</span>
          <h1 className="m-0 ms-2">
            <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>SANOS Y SALVOS</Link>
          </h1>
        </div>

        <div className={`nav-menu${menuOpen ? ' active' : ''} ${menuOpen ? 'd-block ' : 'd-none '}d-md-block`}>
          <ul className="nav-list list-unstyled m-0">
            <li className="nav-item d-block d-md-none">
              <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>Inicio</Link>
            </li>
            <li className="nav-item">
              <button className="nav-link" onClick={handleRegistroMascota} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Registrar Mascota
              </button>
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
                    dropdownTimeoutRef.current = setTimeout(() => setDropdownOpen(false), 500);
                  }}
                >
                  <button className="btn-auth-main" onClick={() => setDropdownOpen(!dropdownOpen)}>
                    Hola, Inicia sesión ▼
                  </button>
                  {dropdownOpen && (
                    <div className="dropdown-menu">
                      <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleLogin(); }}>Inicia sesión</button>
                      <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleRegister(); }}>Regístrate</button>
                    </div>
                  )}
                </div>
              ) : authSection}
            </li>
          </ul>
        </div>

        {user && <NavPanel />}

        <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span className={`bar ${menuOpen ? 'active' : ''}`}></span>
          <span className={`bar ${menuOpen ? 'active' : ''}`}></span>
          <span className={`bar ${menuOpen ? 'active' : ''}`}></span>
        </div>
      </div>
    </nav>
  );
}
