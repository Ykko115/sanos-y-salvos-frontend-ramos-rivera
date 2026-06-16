import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthHeaders, verificarRespuesta } from '../../js/auth';
import { useSessionGuard } from '../../hooks/useSessionGuard';
import '../../css/Admin.css';

function getUser() {
  try {
    const raw = JSON.parse(localStorage.getItem('usuario') || 'null');
    return raw?.user || null;
  } catch { return null; }
}

// GET /api/usuario devuelve [{ usuario: {...}, mascotas: [...] }]
function normalizeUsuario(item) {
  if (!item) return null;
  const u = item.usuario || item;
  return {
    id:       u.id,
    rut:      u.rut      || '—',
    nombre:   u.nombre   || '',
    apellido: u.apellido || '',
    email:    u.email    || '—',
    telefono: u.telefono || '—',
    rol:      u.rol      || 'USER',
    activo:   u.activo !== false,
    mascotas: item.mascotas || [],
  };
}

const ROLES_DISPONIBLES = ['USER', 'ADMIN'];

function ModalEditarUsuario({ usuario, onGuardar, onCerrar }) {
  const [form, setForm] = useState({
    email:    usuario.email    === '—' ? '' : usuario.email,
    telefono: usuario.telefono === '—' ? '' : String(usuario.telefono),
    rol:      usuario.rol,
    activo:   usuario.activo,
  });
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');

  const cambiar = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorMsg('');
    try {
      const body = {
        email:    form.email    || undefined,
        telefono: form.telefono ? Number(form.telefono) : undefined,
        rol:      form.rol,
        activo:   form.activo,
      };
      const res = await fetch(`/api/usuario/${usuario.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      const actualizado = await res.json();
      onGuardar(actualizado);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="registro-overlay" style={{ zIndex: 1050 }}>
      <div className="registro-container" style={{ maxWidth: 460 }}>
        <button className="close-btn" onClick={onCerrar}>✕</button>
        <div className="registro-header">
          <h2>Editar usuario</h2>
          <p>{usuario.nombre} {usuario.apellido}</p>
        </div>
        <form onSubmit={guardar} className="registro-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={cambiar}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="number"
              name="telefono"
              value={form.telefono}
              onChange={cambiar}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>Rol</label>
            <select name="rol" value={form.rol} onChange={cambiar} className="form-select">
              {ROLES_DISPONIBLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              name="activo"
              id="activo"
              checked={form.activo}
              onChange={cambiar}
              style={{ width: 18, height: 18 }}
            />
            <label htmlFor="activo" style={{ marginBottom: 0 }}>Cuenta activa</label>
          </div>
          {errorMsg && <div className="error-message-submit">{errorMsg}</div>}
          <button type="submit" className="btn-submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsuarios() {
  const navigate = useNavigate();
  useSessionGuard();
  const currentUser = getUser();
  const isAdmin = currentUser?.rol?.toLowerCase() === 'admin';

  const [usuarios, setUsuarios] = useState([]);
  const [mascotasCount, setMascotasCount] = useState({});
  const [q, setQ]               = useState('');
  const [rolFiltro, setRolFiltro] = useState('Todos');
  const [loading, setLoading]    = useState(true);
  const [error, setError]        = useState(null);
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  useEffect(() => {
    if (!currentUser || !isAdmin) { navigate('/'); return; }
    let mounted = true;
    fetch('/api/usuario', { headers: getAuthHeaders(false) })
      .then(verificarRespuesta)
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        const lista = (Array.isArray(data) ? data : []).map(normalizeUsuario).filter(Boolean);
        setUsuarios(lista);
        setError(null);
      })
      .catch(err => {
        if (!mounted) return;
        setError(err.message);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!currentUser || !isAdmin) return;
    fetch('/api/mascotas', { headers: getAuthHeaders(false) })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const conteo = {};
        (Array.isArray(data) ? data : []).forEach(item => {
          const uid = (item.mascota || item).usuarioId;
          if (uid != null) conteo[uid] = (conteo[uid] || 0) + 1;
        });
        setMascotasCount(conteo);
      })
      .catch(() => {});
  }, []);

  const roles = useMemo(() => {
    const set = new Set(usuarios.map(u => String(u.rol)));
    return ['Todos', ...Array.from(set)];
  }, [usuarios]);

  const filtrados = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return usuarios.filter(u => {
      const nombre = `${u.nombre} ${u.apellido}`.toLowerCase();
      const matchText = !texto || nombre.includes(texto) || u.email.toLowerCase().includes(texto) || u.rut.toLowerCase().includes(texto);
      const matchRol  = rolFiltro === 'Todos' || String(u.rol) === rolFiltro;
      return matchText && matchRol;
    });
  }, [usuarios, q, rolFiltro]);

  const guardarEdicion = (usuarioActualizado) => {
    const u = usuarioActualizado;
    setUsuarios(prev => prev.map(x =>
      x.id === u.id
        ? { ...x, email: u.email || x.email, telefono: u.telefono || x.telefono, rol: u.rol, activo: u.activo }
        : x
    ));
    setUsuarioEditando(null);
  };

  const eliminarUsuario = async (id) => {
    if (!window.confirm('¿Eliminar usuario? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`/api/usuario/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(false),
      });
      verificarRespuesta(res);
      setUsuarios(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (!currentUser || !isAdmin) return null;

  const modal = usuarioEditando
    ? <ModalEditarUsuario
        usuario={usuarioEditando}
        onGuardar={guardarEdicion}
        onCerrar={() => setUsuarioEditando(null)}
      />
    : null;

  const countAdmin   = usuarios.filter(u => String(u.rol).toUpperCase() === 'ADMIN').length;
  const countActivos = usuarios.filter(u => u.activo).length;
  const countBloq    = usuarios.filter(u => !u.activo).length;

  return (
    <div className="admin-dashboard">
      {modal}
      <div className="container">
        <div className="admin-header mb-4">
          <h1>👥 Gestión de Usuarios</h1>
          <p className="mb-0">Consulta y administra las cuentas registradas en la plataforma</p>
        </div>

        {/* Stats */}
        <div className="row mb-4">
          <div className="col-6 col-md-3">
            <div className="stats-card">
              <div className="stats-number">{usuarios.length}</div>
              <div className="stats-label">Total usuarios</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stats-card">
              <div className="stats-number">{countAdmin}</div>
              <div className="stats-label">Administradores</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stats-card">
              <div className="stats-number">{countActivos}</div>
              <div className="stats-label">Activos</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stats-card">
              <div className="stats-number">{countBloq}</div>
              <div className="stats-label">Bloqueados</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="row mb-3 align-items-center">
          <div className="col-md-7 mb-2 mb-md-0">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre, email o RUT..."
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{ borderRadius: '25px' }}
            />
          </div>
          <div className="col-md-3 mb-2 mb-md-0">
            <select className="form-select" value={rolFiltro} onChange={e => setRolFiltro(e.target.value)}>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <Link to="/admin" className="btn btn-volver w-100">← Volver</Link>
          </div>
        </div>

        {/* Tabla */}
        <div className="product-list">
          {loading && <p className="text-center py-4">Cargando usuarios...</p>}
          {error && <div className="alert alert-danger">{error}</div>}
          {!loading && !error && filtrados.length === 0 && (
            <p className="text-center text-muted py-4">No se encontraron usuarios.</p>
          )}
          {!loading && !error && filtrados.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>RUT</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Mascotas</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(u => (
                    <tr key={u.id}>
                      <td className="text-muted" style={{ fontSize: '0.85rem' }}>{u.id}</td>
                      <td><strong>{`${u.nombre} ${u.apellido}`.trim() || '—'}</strong></td>
                      <td>{u.email}</td>
                      <td>{u.rut}</td>
                      <td>{u.telefono}</td>
                      <td>
                        <span className={String(u.rol).toUpperCase() === 'ADMIN' ? 'badge-rol-admin' : 'badge-rol-user'}>
                          {u.rol}
                        </span>
                      </td>
                      <td>
                        {u.activo
                          ? <span className="badge-activo">Activo</span>
                          : <span className="badge-inactivo">Bloqueado</span>}
                      </td>
                      <td className="text-center">{mascotasCount[u.id] ?? 0}</td>
                      <td style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => setUsuarioEditando(u)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => eliminarUsuario(u.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
