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

// GET /api/reportes devuelve:
// [{ id, nombre_mascota, nombre_usuario, usuarioId, mascotaId,
//    descripcion, fechaReporte, telefono,
//    ubicacion: { latitude, longitude }, img, estado }]
function normalizeReporte(raw) {
  if (!raw) return null;
  const ubicacion = raw.ubicacion
    ? `${raw.ubicacion.latitude ?? ''}${raw.ubicacion.longitude ? ', ' + raw.ubicacion.longitude : ''}`
    : '—';
  return {
    id:             raw.id,
    nombreMascota:  raw.nombre_mascota || '—',
    nombreUsuario:  raw.nombre_usuario || '—',
    usuarioId:      raw.usuarioId,
    mascotaId:      raw.mascotaId,
    descripcion:    raw.descripcion   || '—',
    fechaReporte:   raw.fechaReporte,
    telefono:       raw.telefono      || '—',
    ubicacion,
    ubicacionRaw:   raw.ubicacion     || null,
    img:            raw.img,
    estado:         raw.estado        || '—',
  };
}

const ESTADOS_REPORTE = ['PERDIDO', 'ENCONTRADO'];

function ModalEditarReporte({ reporte, onGuardar, onCerrar }) {
  const [form, setForm] = useState({
    estado:      reporte.estado === '—' ? 'PERDIDO' : reporte.estado,
    descripcion: reporte.descripcion === '—' ? '' : reporte.descripcion,
    telefono:    reporte.telefono === '—' ? '' : String(reporte.telefono),
  });
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorMsg('');
    try {
      // El PUT sobreescribe todos los campos — preservamos los que no editamos
      const body = {
        usuarioId:   reporte.usuarioId   || null,
        mascotaId:   reporte.mascotaId   || null,
        descripcion: form.descripcion    || null,
        telefono:    form.telefono ? Number(form.telefono) : null,
        estado:      form.estado,
        ubicacion:   reporte.ubicacionRaw,
        img:         reporte.img         || null,
      };
      const res = await fetch(`/api/reportes/${reporte.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      const actualizado = await res.json();

      // Sincronizar estado de la mascota si el reporte tiene mascotaId
      if (reporte.mascotaId) {
        await fetch(`/api/mascotas/${reporte.mascotaId}/estado`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ estado: form.estado }),
        }).catch(() => {});
      }

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
          <h2>Editar reporte</h2>
          <p>{reporte.nombreMascota} — {reporte.nombreUsuario}</p>
        </div>
        <form onSubmit={guardar} className="registro-form">
          <div className="form-group">
            <label>Estado</label>
            <select name="estado" value={form.estado} onChange={cambiar} className="form-select">
              {ESTADOS_REPORTE.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={cambiar}
              className="form-control"
              rows={3}
              style={{ resize: 'vertical' }}
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
          {errorMsg && <div className="error-message-submit">{errorMsg}</div>}
          <button type="submit" className="btn-submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminReportes() {
  const navigate = useNavigate();
  useSessionGuard();
  const currentUser = getUser();
  const isAdmin = currentUser?.rol?.toLowerCase() === 'admin';

  const [reportes, setReportes]     = useState([]);
  const [q, setQ]                   = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [reporteEditando, setReporteEditando] = useState(null);

  useEffect(() => {
    if (!currentUser || !isAdmin) { navigate('/'); return; }
    let mounted = true;

    const headers = getAuthHeaders(false);

    Promise.all([
      fetch('/api/reportes', { headers }).then(verificarRespuesta).then(r => r.json()),
      fetch('/api/usuario',  { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
    ])
      .then(async ([dataReportes, dataUsuarios]) => {
        if (!mounted) return;

        // Mapa usuarioId → nombre completo
        const usuarioMap = {};
        (Array.isArray(dataUsuarios) ? dataUsuarios : []).forEach(item => {
          const u = item.usuario || item;
          if (u?.id) usuarioMap[u.id] = `${u.nombre || ''} ${u.apellido || ''}`.trim() || u.email || `Usuario ${u.id}`;
        });

        // Obtenemos solo las mascotas referenciadas (sin fotos — endpoint individual)
        const mascotaIds = [...new Set(
          (Array.isArray(dataReportes) ? dataReportes : [])
            .filter(r => r.mascotaId != null && !r.nombre_mascota)
            .map(r => r.mascotaId)
        )];
        const mascotaMap = {};
        await Promise.all(
          mascotaIds.map(id =>
            fetch(`/api/mascotas/${id}`, { headers })
              .then(r => r.ok ? r.json() : null)
              .then(data => { const m = data?.mascota || data; if (m?.id) mascotaMap[m.id] = m.nombre || `Mascota ${m.id}`; })
              .catch(() => {})
          )
        );

        const lista = (Array.isArray(dataReportes) ? dataReportes : [])
          .map(raw => {
            const r = normalizeReporte(raw);
            if (!r) return null;
            if (r.nombreMascota === '—' && raw.mascotaId && mascotaMap[raw.mascotaId])
              r.nombreMascota = mascotaMap[raw.mascotaId];
            if (r.nombreUsuario === '—' && raw.usuarioId && usuarioMap[raw.usuarioId])
              r.nombreUsuario = usuarioMap[raw.usuarioId];
            return r;
          })
          .filter(Boolean);

        lista.sort((a, b) => new Date(b.fechaReporte || 0) - new Date(a.fechaReporte || 0));
        if (mounted) { setReportes(lista); setError(null); }
      })
      .catch(err => {
        if (!mounted) return;
        setError(err.message);
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, []);

  const estados = useMemo(() => {
    const set = new Set(reportes.map(r => r.estado));
    return ['Todos', ...Array.from(set)];
  }, [reportes]);

  const filtrados = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return reportes.filter(r => {
      const matchText = !texto
        || r.nombreMascota.toLowerCase().includes(texto)
        || r.nombreUsuario.toLowerCase().includes(texto)
        || r.descripcion.toLowerCase().includes(texto)
        || r.ubicacion.toLowerCase().includes(texto);
      const matchEstado = estadoFiltro === 'Todos' || r.estado === estadoFiltro;
      return matchText && matchEstado;
    });
  }, [reportes, q, estadoFiltro]);

  const guardarEdicionReporte = (actualizado) => {
    setReportes(prev => prev.map(r =>
      r.id === actualizado.id
        ? { ...r, estado: actualizado.estado, descripcion: actualizado.descripcion || r.descripcion, telefono: actualizado.telefono || r.telefono }
        : r
    ));
    setReporteEditando(null);
  };

  const eliminarReporte = async (id) => {
    if (!window.confirm('¿Eliminar este reporte? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`/api/reportes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(false),
      });
      verificarRespuesta(res);
      setReportes(prev => prev.filter(r => r.id !== id));
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
      default:           return <span className="badge-rol-user">{estado}</span>;
    }
  };

  if (!currentUser || !isAdmin) return null;

  const modal = reporteEditando
    ? <ModalEditarReporte
        reporte={reporteEditando}
        onGuardar={guardarEdicionReporte}
        onCerrar={() => setReporteEditando(null)}
      />
    : null;

  const countPerdidos    = reportes.filter(r => r.estado === 'PERDIDO').length;
  const countEncontrados = reportes.filter(r => r.estado === 'ENCONTRADO').length;

  return (
    <div className="admin-dashboard">
      {modal}
      <div className="container">
        <div className="admin-header mb-4">
          <h1>📋 Gestión de Reportes</h1>
          <p className="mb-0">Todos los reportes de mascotas perdidas y encontradas</p>
        </div>

        {/* Stats */}
        <div className="row mb-4">
          <div className="col-6 col-md-4">
            <div className="stats-card">
              <div className="stats-number">{reportes.length}</div>
              <div className="stats-label">Total reportes</div>
            </div>
          </div>
          <div className="col-6 col-md-4">
            <div className="stats-card">
              <div className="stats-number">{countPerdidos}</div>
              <div className="stats-label">Perdidos</div>
            </div>
          </div>
          <div className="col-6 col-md-4">
            <div className="stats-card">
              <div className="stats-number">{countEncontrados}</div>
              <div className="stats-label">Encontrados</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="row mb-3 align-items-center">
          <div className="col-md-7 mb-2 mb-md-0">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por mascota, usuario, descripción o ubicación..."
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{ borderRadius: '25px' }}
            />
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
          {loading && <p className="text-center py-4">Cargando reportes...</p>}
          {error && <div className="alert alert-danger">{error}</div>}
          {!loading && !error && filtrados.length === 0 && (
            <p className="text-center text-muted py-4">No se encontraron reportes.</p>
          )}
          {!loading && !error && filtrados.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Mascota</th>
                    <th>Reportado por</th>
                    <th>Estado</th>
                    <th>Ubicación (lat, lng)</th>
                    <th>Descripción</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(r => (
                    <tr key={r.id}>
                      <td className="text-muted" style={{ fontSize: '0.85rem' }}>{r.id}</td>
                      <td>
                        <strong>{r.nombreMascota}</strong>
                        {r.img && (
                          <a href={r.img} target="_blank" rel="noreferrer" className="ms-1" title="Ver foto">
                            🖼️
                          </a>
                        )}
                      </td>
                      <td>{r.nombreUsuario}</td>
                      <td>{estadoBadge(r.estado)}</td>
                      <td style={{ fontSize: '0.82rem', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.ubicacion}
                      </td>
                      <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={r.descripcion}>
                        {r.descripcion}
                      </td>
                      <td>{formatFecha(r.fechaReporte)}</td>
                      <td style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => setReporteEditando(r)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => eliminarReporte(r.id)}
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
