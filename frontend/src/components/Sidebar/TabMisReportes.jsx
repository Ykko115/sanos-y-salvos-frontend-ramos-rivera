import { useLocation, useNavigate } from 'react-router-dom';
import { useMisReportes } from '../../hooks/useMisReportes';

const ESTADO_CONFIG = {
  PERDIDO:    { label: 'Perdido',    bg: '#fee2e2', color: '#c0392b' },
  ENCONTRADO: { label: 'Encontrado', bg: '#fef3c7', color: '#b45309' },
  REUNIDA:    { label: 'Reunido',    bg: '#dcfce7', color: '#15803d' },
};

function encodeId(id) {
  try { return encodeURIComponent(btoa(String(id))); }
  catch { return String(id); }
}

function emoji(especie) {
  const e = String(especie || '').toLowerCase();
  if (e.includes('perro')) return '🐕';
  if (e.includes('gato')) return '🐈';
  return '🐾';
}

export default function TabMisReportes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { reportes, cargando, usuario } = useMisReportes();

  if (!usuario) {
    return (
      <div className="tab-vacio">
        <span style={{ fontSize: '2rem' }}>🔒</span>
        <p>Inicia sesion para ver tus reportes.</p>
      </div>
    );
  }

  if (cargando) return <p className="reporte-cargando">Cargando tus reportes...</p>;

  if (reportes.length === 0) {
    return (
      <div className="tab-vacio">
        <span style={{ fontSize: '2rem' }}>📋</span>
        <p>No tienes reportes aun.</p>
        <small>Crea uno desde el boton "Nuevo Reporte".</small>
      </div>
    );
  }

  return (
    <div className="mis-reportes-lista">
      {reportes.map((r) => {
        const conf = ESTADO_CONFIG[r.estado] || { label: r.estado || '—', bg: '#f3f4f6', color: '#666' };
        const nombre =
          r.nombre || r.nombre_mascota || r.mascota?.nombre || r.nombreMascota || 'Sin nombre';
        const esp = r.especie || r.mascota?.especie || r.tipo || '';
        const raza = r.raza || r.mascota?.raza || '';
        const fecha = r.fechaReporte || r.fecha_perdida || r.fecha || '';
        const fechaFmt = fecha ? new Date(fecha).toLocaleDateString('es-CL') : '—';
        const rId = r.id || r.reporte?.id;

        return (
          <div key={rId || nombre} className="mis-reportes-card">
            <div className="mis-reportes-card-top">
              <span className="mis-reportes-animal">{emoji(esp)}</span>
              <div className="mis-reportes-meta">
                <strong className="mis-reportes-nombre">{nombre}</strong>
                {raza && <span className="mis-reportes-raza">{raza}</span>}
                <span className="mis-reportes-fecha">{fechaFmt}</span>
              </div>
              <span
                className="mis-reportes-badge"
                style={{ background: conf.bg, color: conf.color }}
              >
                {conf.label}
              </span>
            </div>

            {r.descripcion && (
              <p className="mis-reportes-desc">{r.descripcion}</p>
            )}

            {rId && (
              <button
                className="mis-reportes-btn-ver"
                onClick={() =>
                  navigate(`/modalreporte/${encodeId(rId)}`, {
                    state: { backgroundLocation: location },
                  })
                }
              >
                Ver detalle
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
