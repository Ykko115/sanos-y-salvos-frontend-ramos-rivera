import { useState } from 'react';
import { useReporte } from '../../hooks/useReporte';

const FILTROS = [
  { id: 'todo',       label: 'Todo' },
  { id: 'perdidas',   label: 'Perdidas' },
  { id: 'encontradas',label: 'Encontradas' },
  { id: 'refugio',    label: 'Refugio' },
  { id: 'mes',        label: 'Este mes' },
];

function BarChart({ valores }) {
  if (!valores?.length) return null;
  const max = Math.max(...valores, 1);
  return (
    <div className="barchart-wrap">
      <div className="barchart">
        {valores.map((v, i) => (
          <div key={i} className="barchart-col">
            <div
              className="barchart-bar"
              style={{ height: `${(v / max) * 100}%` }}
              title={`Sem ${i + 1}: ${v}`}
            />
            <span className="barchart-label">{v}</span>
          </div>
        ))}
      </div>
      <div className="barchart-eje">
        {valores.map((_, i) => <span key={i}>S{i + 1}</span>)}
      </div>
    </div>
  );
}

function StatBox({ valor, label, color }) {
  return (
    <div className="stat-box" style={{ borderTopColor: color }}>
      <span className="stat-numero" style={{ color }}>{valor ?? '—'}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export default function TabReporte() {
  const [filtro, setFiltro] = useState('todo');
  const { data, cargando, exportar } = useReporte(filtro);

  return (
    <div className="tab-reporte">
      {/* Filtros */}
      <div className="filtros-chips">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            className={`chip ${filtro === f.id ? 'chip-activo' : ''}`}
            onClick={() => setFiltro(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {cargando && <p className="reporte-cargando">Cargando datos...</p>}

      {data && (
        <>
          {/* Stats */}
          <div className="stats-grid">
            <StatBox valor={data.total_perdidas}  label="Perdidas"  color="#e24b4a" />
            <StatBox valor={data.total_reunidas}  label="Reunidas"  color="#2d8a4e" />
            <StatBox valor={data.total_refugio}   label="Refugio"   color="#185fa5" />
          </div>

          {/* Zona */}
          {data.zona_mas_reportes && (
            <p className="zona-mas">
              📍 Zona con más reportes: <strong>{data.zona_mas_reportes}</strong>
              {data.por_zona?.[0] && ` (${data.por_zona[0].count})`}
            </p>
          )}

          {/* Gráfico por semana */}
          {data.por_semana?.length > 0 && (
            <div className="grafico-section">
              <p className="grafico-titulo">Reportes por semana</p>
              <BarChart valores={data.por_semana} />
            </div>
          )}

          {/* Exportar */}
          <div className="exportar-btns">
            <button className="btn-exportar pdf" onClick={() => exportar('pdf')}>
              📄 Exportar PDF
            </button>
            <button className="btn-exportar xlsx" onClick={() => exportar('xlsx')}>
              📊 Exportar Excel
            </button>
          </div>
        </>
      )}

      {!cargando && !data && (
        <p className="reporte-error">No se pudieron cargar las estadisticas.</p>
      )}

      {!cargando && data && data.total_perdidas === 0 && data.total_encontradas === 0 && data.total_reunidas === 0 && (
        <p className="reporte-cargando">Aun no hay reportes registrados en el sistema.</p>
      )}
    </div>
  );
}
