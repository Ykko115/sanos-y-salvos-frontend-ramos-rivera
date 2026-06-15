import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthHeaders, verificarRespuesta } from '../../js/auth';
import '../../css/Admin.css';

function getUser() {
  try {
    const raw = JSON.parse(localStorage.getItem('usuario') || 'null');
    return raw?.user || null;
  } catch { return null; }
}

// GET /api/mascotas devuelve [{ mascota: {...}, usuario: {...} }]
function normalizeMascota(item) {
  if (!item) return null;
  const m = item.mascota || item;
  const u = item.usuario || null;
  return {
    id:           m.id,
    nombre:       m.nombre    || '—',
    especie:      m.especie   || '—',
    raza:         m.raza      || '—',
    color:        m.color     || '—',
    tamano:       m.tamano    || '—',
    rangoEdad:    m.rangoEdad || '—',
    estado:       m.estado    || '—',
    descripcion:  m.descripcion || '—',
    fotoUrl:      m.fotoUrl   || null,
    fechaReporte: m.fechaReporte,
    usuarioId:    m.usuarioId,
    usuarioNombre: u
      ? `${u.nombre || ''} ${u.apellido || ''}`.trim() || u.email || '—'
      : '—',
  };
}

export default function AdminMascotas() {
  const navigate = useNavigate();
  const currentUser = getUser();
  const isAdmin = currentUser?.rol?.toLowerCase() === 'admin';

  const [mascotas, setMascotas]       = useState([]);
  const [q, setQ]                     = useState('');
  const [especieFiltro, setEspecieFiltro] = useState('Todas');
  const [estadoFiltro, setEstadoFiltro]   = useState('Todos');
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    if (!currentUser || !isAdmin) { navigate('/'); return; }
    let mounted = true;
    fetch('/api/mascotas', { headers: getAuthHeaders(false) })
      .then(verificarRespuesta)
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        const lista = (Array.isArray(data) ? data : []).map(normalizeMascota).filter(Boolean);
        setMascotas(lista);
        setError(null);
      })
      .catch(err => {
        if (!mounted) return;
        setError(err.message);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const especies = useMemo(() => {
    const set = new Set(mascotas.map(m => m.especie));
    return ['Todas', ...Array.from(set)];
  }, [mascotas]);

  const estados = useMemo(() => {
    const set = new Set(mascotas.map(m => m.estado));
    return ['Todos', ...Array.from(set)];
  }, [mascotas]);

  const filtradas = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return mascotas.filter(m => {
      const matchText = !texto
        || m.nombre.toLowerCase().includes(texto)
        || m.especie.toLowerCase().includes(texto)
        || m.raza.toLowerCase().includes(texto)
        || m.usuarioNombre.toLowerCase().includes(texto);
      const matchEspecie = especieFiltro === 'Todas' || m.especie === especieFiltro;
      const matchEstado  = estadoFiltro  === 'Todos'  || m.estado  === estadoFiltro;
      return matchText && matchEspecie && matchEstado;
    });
  }, [mascotas, q, especieFiltro, estadoFiltro]);

  const eliminarMascota = async (id) => {
    if (!window.confirm('¿Eliminar esta mascota? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`/api/mascotas/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(false),
      });
      verificarRespuesta(res);
      setMascotas(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const formatFecha = (f) => {
    if (!f) return '—';
    try { return new Date(f).toLocaleDateString('es-CL'); } catch { return '—'; }
  };

  const estadoBadge = (estado) => {
    switch ((estado || '').toUpperCase()) {
      case 'PERDIDO':    return <span className="badge-inactivo">PERDIDO</span>;
      case 'ENCONTRADO': return <span className="badge-activo">ENCONTRADO</span>;
      case 'REUNIDO':    return <span className="badge-rol-user">REUNIDO</span>;
      default:           return <span className="badge-rol-user">{estado}</span>;
    }
  };

  if (!currentUser || !isAdmin) return null;

  const countPerdidos    = mascotas.filter(m => m.estado === 'PERDIDO').length;
  const countEncontrados = mascotas.filter(m => m.estado === 'ENCONTRADO').length;
  const countReunidos    = mascotas.filter(m => m.estado === 'REUNIDO').length;

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header mb-4">
          <h1>🐾 Gestión de Mascotas</h1>
          <p className="mb-0">Todas las mascotas registradas en la plataforma</p>
        </div>

        {/* Stats */}
        <div className="row mb-4">
          <div className="col-6 col-md-3">
            <div className="stats-card">
              <div className="stats-number">{mascotas.length}</div>
              <div className="stats-label">Total mascotas</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stats-card">
              <div className="stats-number">{countPerdidos}</div>
              <div className="stats-label">Perdidas</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stats-card">
              <div className="stats-number">{countEncontrados}</div>
              <div className="stats-label">Encontradas</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stats-card">
              <div className="stats-number">{countReunidos}</div>
              <div className="stats-label">Reunidas</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="row mb-3 align-items-center">
          <div className="col-md-5 mb-2 mb-md-0">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre, especie, raza o dueño..."
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{ borderRadius: '25px' }}
            />
          </div>
          <div className="col-md-2 mb-2 mb-md-0">
            <select className="form-select" value={especieFiltro} onChange={e => setEspecieFiltro(e.target.value)}>
              {especies.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="col-md-3 mb-2 mb-md-0">
            <select className="form-select" value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)}>
              {estados.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <Link to="/admin" className="btn btn-volver w-100">← Volver</Link>
          </div>
        </div>

        {/* Tabla */}
        <div className="product-list">
          {loading && <p className="text-center py-4">Cargando mascotas...</p>}
          {error && <div className="alert alert-danger">{error}</div>}
          {!loading && !error && filtradas.length === 0 && (
            <p className="text-center text-muted py-4">No se encontraron mascotas.</p>
          )}
          {!loading && !error && filtradas.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Especie</th>
                    <th>Raza</th>
                    <th>Color</th>
                    <th>Tamaño</th>
                    <th>Edad</th>
                    <th>Estado</th>
                    <th>Dueño</th>
                    <th>Fecha</th>
                    <th>Foto</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map(m => (
                    <tr key={m.id}>
                      <td className="text-muted" style={{ fontSize: '0.85rem' }}>{m.id}</td>
                      <td><strong>{m.nombre}</strong></td>
                      <td>{m.especie}</td>
                      <td>{m.raza}</td>
                      <td>{m.color}</td>
                      <td>{m.tamano}</td>
                      <td>{m.rangoEdad}</td>
                      <td>{estadoBadge(m.estado)}</td>
                      <td>{m.usuarioNombre}</td>
                      <td>{formatFecha(m.fechaReporte)}</td>
                      <td>
                        {m.fotoUrl
                          ? <a href={m.fotoUrl} target="_blank" rel="noreferrer" title="Ver foto">🖼️</a>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => eliminarMascota(m.id)}
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
