import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../css/Admin.css';

function getUser() {
  try {
    const raw = JSON.parse(localStorage.getItem('usuario') || 'null');
    return raw?.user || null;
  } catch { return null; }
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const user = getUser();
  const isAdmin = user?.rol?.toLowerCase() === 'admin';

  useEffect(() => {
    if (!user || !isAdmin) navigate('/');
  }, []);

  if (!user || !isAdmin) return null;

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header mb-4">
          <h1>🛡️ Panel de Administración</h1>
          <p className="lead mb-0">Gestiona usuarios, reportes y mascotas de la plataforma</p>
        </div>

        <div className="row">
          <div className="col-md-4 mb-4">
            <div className="card admin-card h-100">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">👥 Gestión de Usuarios</h5>
                <p className="card-text flex-grow-1">
                  Consulta, edita roles, bloquea o elimina cuentas de usuario de la plataforma.
                </p>
                <div className="d-grid mt-3">
                  <Link to="/admin/usuarios" className="btn btn-primary">
                    Ver Usuarios
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card admin-card h-100">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">📋 Gestión de Reportes</h5>
                <p className="card-text flex-grow-1">
                  Revisa todos los reportes de mascotas perdidas y encontradas en la plataforma.
                </p>
                <div className="d-grid mt-3">
                  <Link to="/admin/reportes" className="btn btn-primary">
                    Ver Reportes
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card admin-card h-100">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">🐾 Gestión de Mascotas</h5>
                <p className="card-text flex-grow-1">
                  Administra el registro de mascotas: visualiza, edita o elimina fichas.
                </p>
                <div className="d-grid mt-3">
                  <Link to="/admin/mascotas" className="btn btn-primary">
                    Ver Mascotas
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-2">
          <div className="col-12 text-center text-muted" style={{ fontSize: '0.9rem' }}>
            Bienvenido, <strong>{user.nombre || user.email}</strong> · Rol: <strong>{user.rol}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
