import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

const CRITERIO_LABEL = {
  especie: '🐾 Especie',
  raza:    '🔬 Raza',
  color:   '🎨 Color',
  zona:    '📍 Zona',
  fecha:   '📅 Fecha',
};

const EMOJI_ESPECIE = { perro: '🐕', gato: '🐈', huron: '🐿️', roedor: '🐭' };

function emoji(especie = '') {
  return EMOJI_ESPECIE[especie.toLowerCase()] || '🐾';
}

function ScoreBadge({ score }) {
  const color = score >= 90 ? '#2d8a4e' : score >= 75 ? '#f59e0b' : '#185fa5';
  return (
    <span style={{
      background: color, color: '#fff', borderRadius: 20,
      padding: '2px 10px', fontWeight: 700, fontSize: '0.85rem',
    }}>
      {score}%
    </span>
  );
}

function CardCoincidencia({ c, onConfirmar, onDescartar }) {
  const [confirmando, setConfirmando] = useState(false);

  const handleConfirmar = async () => {
    setConfirmando(true);
    await onConfirmar(c);
    setConfirmando(false);
  };

  return (
    <div className="coincidencia-card">
      <div className="coincidencia-header">
        <ScoreBadge score={c.score} />
        <div className="coincidencia-criterios">
          {c.criterios.map((cr) => (
            <span key={cr} className="criterio-chip">{CRITERIO_LABEL[cr] || cr}</span>
          ))}
        </div>
      </div>

      <div className="coincidencia-mascotas">
        <div className="coincidencia-mascota perdida">
          <div className="mascota-emoji">{emoji(c.mascota_perdida.especie)}</div>
          <div className="mascota-info">
            <strong>{c.mascota_perdida.nombre}</strong>
            <span>{c.mascota_perdida.raza}</span>
            <span className="mascota-zona">📍 {c.mascota_perdida.comuna || 'Sin zona'}</span>
          </div>
          <span className="estado-badge perdida-badge">PERDIDA</span>
        </div>

        <div className="coincidencia-flecha">↔</div>

        <div className="coincidencia-mascota encontrada">
          <div className="mascota-emoji">{emoji(c.mascota_encontrada.especie)}</div>
          <div className="mascota-info">
            <strong>{c.mascota_encontrada.nombre}</strong>
            <span>{c.mascota_encontrada.raza}</span>
            <span className="mascota-zona">📍 {c.mascota_encontrada.comuna || 'Sin zona'}</span>
          </div>
          <span className="estado-badge encontrada-badge">ENCONTRADA</span>
        </div>
      </div>

      <div className="coincidencia-acciones">
        <button
          className="btn-confirmar"
          onClick={handleConfirmar}
          disabled={confirmando}
        >
          {confirmando ? 'Confirmando...' : '✅ Confirmar reunión'}
        </button>
        <button className="btn-descartar" onClick={() => onDescartar(c.id)}>
          Descartar
        </button>
      </div>
    </div>
  );
}

export default function TabCoincidencias() {
  const { state, dispatch } = useAppContext();
  const { coincidencias } = state;

  const confirmarReunion = async (c) => {
    // Intentar actualizar estado en Spring Boot
    await Promise.allSettled([
      fetch(`/api/mascotas/${c.mascota_perdida.id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'REUNIDA' }),
      }),
      fetch(`/api/mascotas/${c.mascota_encontrada.id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'REUNIDA' }),
      }),
    ]);

    // Emitir evento via Node server
    await fetch('/api/notificar/mascota-reunida', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coincidenciaId: c.id, mascotaId: c.mascota_perdida.id }),
    }).catch(() => {});

    dispatch({ type: 'MASCOTA_REUNIDA', payload: c.mascota_perdida.id });
    dispatch({ type: 'MASCOTA_REUNIDA', payload: c.mascota_encontrada.id });
  };

  const descartar = (id) => dispatch({ type: 'QUITAR_COINCIDENCIA', payload: id });

  if (!coincidencias.length) {
    return (
      <div className="tab-vacio">
        <span style={{ fontSize: '2.5rem' }}>🔍</span>
        <p>Sin coincidencias activas</p>
        <small>El sistema revisa cada 20 segundos</small>
      </div>
    );
  }

  return (
    <div className="tab-coincidencias">
      {coincidencias.map((c) => (
        <CardCoincidencia
          key={c.id}
          c={c}
          onConfirmar={confirmarReunion}
          onDescartar={descartar}
        />
      ))}
    </div>
  );
}
