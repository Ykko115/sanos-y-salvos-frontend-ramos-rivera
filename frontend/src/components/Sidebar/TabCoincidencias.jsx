import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../../context/AppContext';

const EMOJI = { PERRO: '🐕', GATO: '🐈', HURON: '🐿️', ROEDOR: '🐭' };
const fmt = (v) => v ? String(v).charAt(0) + String(v).slice(1).toLowerCase().replace(/_/g, ' ') : '';

const SENAS_LABEL = {
  COLLAR: 'Collar', CICATRIZ: 'Cicatriz', TATUAJE: 'Tatuaje',
  MANCHA: 'Mancha', COJERA: 'Cojera', OJO_DIFERENTE: 'Ojo diferente',
  COLA_CORTA: 'Cola corta', OREJA_CORTADA: 'Oreja cortada',
};

function ScoreBarra({ pct }) {
  const color = pct >= 85 ? '#2d8a4e' : pct >= 65 ? '#f59e0b' : '#185fa5';
  return (
    <div style={{ margin: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 3 }}>
        <span style={{ color: '#666' }}>Similitud</span>
        <strong style={{ color }}>{pct}%</strong>
      </div>
      <div style={{ background: '#e5e7eb', borderRadius: 8, height: 8 }}>
        <div style={{ width: `${pct}%`, background: color, borderRadius: 8, height: 8, transition: 'width 0.6s' }} />
      </div>
    </div>
  );
}

// ── Modal de detalle del encontrado ──────────────────────────────────
function ModalDetalleEncontrada({ encontrada, perdida, porcentaje, onConfirmar, onDescartar, onCerrar }) {
  const [confirmando, setConfirmando] = useState(false);

  const contactoParts = encontrada?.contacto ? encontrada.contacto.split('|').map(s => s.trim()) : [];
  const contactoNombre = contactoParts[0] || null;
  const contactoTel    = contactoParts[1] || null;
  const senas = Array.isArray(encontrada?.senas) ? encontrada.senas : [];

  const handleConfirmar = async () => {
    setConfirmando(true);
    await onConfirmar();
    setConfirmando(false);
  };

  return createPortal(
    <div
      data-portal-modal="true"
      onClick={onCerrar}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420,
          maxHeight: '88vh', overflowY: 'auto',
          boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
        }}
      >
        {/* Header siempre visible */}
        <div style={{
          background: 'linear-gradient(135deg, #2d8a4e, #1a5c33)',
          borderRadius: '16px 16px 0 0', padding: '18px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem' }}>Mascota encontrada</p>
            <h3 style={{ margin: '2px 0 0', color: '#fff', fontSize: '1.1rem' }}>
              {encontrada ? `${EMOJI[encontrada.especie] || '🐾'} ${fmt(encontrada.especie) || 'Animal'}${encontrada.raza ? ` · ${encontrada.raza}` : ''}` : '🐾 Cargando...'}
            </h3>
          </div>
          <button onClick={onCerrar} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
            borderRadius: 8, width: 32, height: 32, fontSize: '1.1rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        <div style={{ padding: '18px 20px' }}>
          {/* Score siempre visible */}
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.78rem', color: '#555' }}>
              Coincide con <strong>{perdida?.nombre || 'tu mascota'}</strong>
            </p>
            <ScoreBarra pct={porcentaje} />
          </div>

          {/* Detalles (solo si cargaron) */}
          {!encontrada && (
            <p style={{ color: '#aaa', fontSize: '0.85rem', textAlign: 'center', margin: '12px 0 20px' }}>
              Cargando detalles del animal encontrado…
            </p>
          )}

          {encontrada && <>
            {/* Foto */}
            {encontrada.fotoUrl
              ? <img
                  src={encontrada.fotoUrl}
                  alt="Foto mascota encontrada"
                  style={{ width: '100%', borderRadius: 10, marginBottom: 16, objectFit: 'cover', maxHeight: 220 }}
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              : <div style={{
                  width: '100%', height: 150, borderRadius: 10, marginBottom: 16,
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  border: '2px dashed #86efac',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <span style={{ fontSize: '3.5rem', lineHeight: 1 }}>{EMOJI[encontrada.especie] || '🐾'}</span>
                  <span style={{ fontSize: '0.72rem', color: '#6b7280', letterSpacing: '0.03em' }}>Sin foto registrada</span>
                </div>
            }

            {/* Atributos */}
            {(() => {
              const attrs = [
                ['Especie',    fmt(encontrada.especie)],
                ['Raza',       encontrada.raza],
                ['Color',      fmt(encontrada.color)],
                ['Tamaño',     fmt(encontrada.tamano)],
                ['Pelaje',     fmt(encontrada.pelaje)],
                ['Edad aprox.',fmt(encontrada.rangoEdad)],
              ].filter(([, v]) => v);
              return attrs.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', marginBottom: 14 }}>
                  {attrs.map(([label, valor]) => (
                    <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: '8px 10px' }}>
                      <p style={{ margin: 0, fontSize: '0.68rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.85rem', fontWeight: 600, color: '#222' }}>{valor}</p>
                    </div>
                  ))}
                </div>
              ) : null;
            })()}

            {/* Señas particulares */}
            {senas.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ margin: '0 0 6px', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Señas particulares</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {senas.map(s => (
                    <span key={s} style={{
                      background: '#ede9fe', color: '#5b21b6',
                      borderRadius: 20, padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600,
                    }}>
                      {SENAS_LABEL[s] || fmt(s)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Descripción */}
            {encontrada.descripcion && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Descripción</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#444', lineHeight: 1.5 }}>{encontrada.descripcion}</p>
              </div>
            )}

            {/* Contacto */}
            {(contactoNombre || contactoTel) && (
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 10, padding: '12px 14px', marginBottom: 18,
              }}>
                <p style={{ margin: '0 0 6px', fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Contacto del que la encontró
                </p>
                {contactoNombre && <p style={{ margin: '0 0 4px', fontSize: '0.88rem' }}>👤 {contactoNombre}</p>}
                {contactoTel
                  ? <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                      📱 <a href={`tel:${contactoTel}`} style={{ color: '#2d8a4e' }}>{contactoTel}</a>
                    </p>
                  : <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>Sin teléfono registrado</p>
                }
              </div>
            )}
          </>}

          {/* Acciones — SIEMPRE visibles, no dependen de que cargue 'encontrada' */}
          <div style={{ display: 'flex', gap: 10, marginTop: encontrada ? 0 : 8 }}>
            <button
              onClick={handleConfirmar}
              disabled={confirmando}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 10,
                background: '#2d8a4e', color: '#fff', border: 'none',
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              }}
            >
              {confirmando ? 'Confirmando...' : '✅ Sí, es mi mascota'}
            </button>
            <button
              onClick={onDescartar}
              style={{
                padding: '11px 18px', borderRadius: 10,
                background: '#f3f4f6', color: '#666', border: 'none',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              }}
            >
              No es ella
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Card resumida ─────────────────────────────────────────────────────
function CardCoincidenciaDB({ notif }) {
  const [perdida,    setPerdida]    = useState(null);
  const [encontrada, setEncontrada] = useState(null);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [confirmada, setConfirmada] = useState(false);
  const { dispatch } = useAppContext();

  useEffect(() => {
    const unwrap = (data) => data?.mascota || data;
    if (notif.mascotaIdPerdida) {
      fetch(`/api/mascotas/${notif.mascotaIdPerdida}`)
        .then(r => r.ok ? r.json() : null).then(d => setPerdida(unwrap(d))).catch(() => {});
    }
    if (notif.mascotaIdCandidata) {
      fetch(`/api/mascotas/${notif.mascotaIdCandidata}`)
        .then(r => r.ok ? r.json() : null).then(d => setEncontrada(unwrap(d))).catch(() => {});
    }
  }, [notif.mascotaIdPerdida, notif.mascotaIdCandidata]);

  const confirmar = async () => {
    console.log('[Reunion DB] confirmar() llamado', {
      mascotaIdPerdida: notif.mascotaIdPerdida,
      mascotaIdCandidata: notif.mascotaIdCandidata,
      notifId: notif.id,
    });

    // 1. Ocultar al INSTANTE (actualización optimista)
    dispatch({ type: 'MASCOTA_REUNIDA', payload: notif.mascotaIdPerdida });
    dispatch({ type: 'MASCOTA_REUNIDA', payload: notif.mascotaIdCandidata });
    dispatch({ type: 'QUITAR_NOTIFICACION', payload: `db_${notif.id}` });
    dispatch({
      type: 'ADD_NOTIFICACION',
      payload: {
        id: `reunion_${notif.mascotaIdPerdida}_${Date.now()}`,
        tipo: 'mascota_reunida',
        titulo: '¡Tu mascota llegó a casa!',
        mensaje: perdida?.nombre
          ? `${perdida.nombre} fue reunida con éxito. ¡Que alegría!`
          : 'Confirmaste la reunión de tu mascota. ¡Que alegría!',
        timestamp: new Date().toISOString(),
        leida: false,
      },
    });
    dispatch({ type: 'SET_TAB', payload: 'notif' });
    setConfirmada(true);
    setModalOpen(false);

    // 2. Persistir en el backend en segundo plano.
    Promise.allSettled([
      fetch(`/api/mascotas/${notif.mascotaIdPerdida}/estado`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'REUNIDO' }),
      }).then(r => console.log('[Reunion DB] PUT estado perdida:', r.status)).catch(e => console.warn('[Reunion DB] PUT estado perdida error:', e)),
      fetch(`/api/mascotas/${notif.mascotaIdCandidata}/estado`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'REUNIDO' }),
      }).then(r => console.log('[Reunion DB] PUT estado candidata:', r.status)).catch(e => console.warn('[Reunion DB] PUT estado candidata error:', e)),
      notif.id
        ? fetch(`/api/mascotas/notificaciones/${notif.id}/leida`, { method: 'PUT' }).catch(() => {})
        : Promise.resolve(),
      fetch(`/api/reportes/mascota/${notif.mascotaIdPerdida}`, { method: 'DELETE' }).catch(() => {}),
      fetch(`/api/reportes/mascota/${notif.mascotaIdCandidata}`, { method: 'DELETE' }).catch(() => {}),
    ]);
  };

  const descartar = () => {
    setModalOpen(false);
    dispatch({ type: 'QUITAR_NOTIFICACION', payload: `db_${notif.id}` });
  };

  if (confirmada) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 12px', background: '#f0fdf4', borderRadius: 12, marginBottom: 12 }}>
        <span style={{ fontSize: '2rem' }}>🎉</span>
        <p style={{ color: '#2d8a4e', fontWeight: 700, marginTop: 6 }}>¡Reunión confirmada!</p>
      </div>
    );
  }

  const espPerdida = perdida?.especie || '';

  return (
    <>
      <div style={{
        background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12,
        padding: '14px 16px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,.06)',
      }}>
        {/* Mascota perdida */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: '1.4rem' }}>{EMOJI[espPerdida] || '🐾'}</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem' }}>
              {perdida?.nombre || 'Tu mascota'} puede haber sido encontrada
            </p>
            <p style={{ margin: 0, fontSize: '0.76rem', color: '#888' }}>
              {fmt(espPerdida)}{perdida?.raza ? ` · ${perdida.raza}` : ''}
              {perdida?.color ? ` · ${fmt(perdida.color)}` : ''}
            </p>
          </div>
        </div>

        <ScoreBarra pct={notif.porcentaje} />

        {/* Resumen encontrada */}
        <div style={{
          background: '#f9fafb', borderRadius: 8, padding: '7px 11px',
          fontSize: '0.78rem', color: '#555', margin: '8px 0',
          display: 'flex', alignItems: 'center', gap: 6, minHeight: 32,
        }}>
          {encontrada ? (
            <>
              <span>{EMOJI[encontrada.especie] || '🐾'}</span>
              <span>
                {fmt(encontrada.especie) || 'Animal'}
                {encontrada.raza ? ` · ${encontrada.raza}` : ''}
                {encontrada.color ? ` · ${fmt(encontrada.color)}` : ''}
                {encontrada.tamano ? ` · ${fmt(encontrada.tamano)}` : ''}
              </span>
            </>
          ) : (
            <span style={{ color: '#bbb' }}>Cargando datos...</span>
          )}
        </div>

        {/* Botón principal */}
        <button
          onClick={() => setModalOpen(true)}
          style={{
            width: '100%', marginTop: 4, padding: '9px 0', borderRadius: 9,
            background: '#185fa5', color: '#fff', border: 'none',
            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
          }}
        >
          🔍 Ver detalles del animal encontrado
        </button>
      </div>

      {modalOpen && (
        <ModalDetalleEncontrada
          encontrada={encontrada}
          perdida={perdida}
          porcentaje={notif.porcentaje}
          onConfirmar={confirmar}
          onDescartar={descartar}
          onCerrar={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

// ── Card coincidencias del mapa (socket) ──────────────────────────────
function CardCoincidenciaSocket({ c, onConfirmar, onDescartar }) {
  const [confirmando, setConfirmando] = useState(false);
  const handleConfirmar = async () => {
    setConfirmando(true);
    await onConfirmar(c);
    setConfirmando(false);
  };
  const p = c.mascota_perdida;
  const e = c.mascota_encontrada;
  return (
    <div style={{
      background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12,
      padding: '14px 16px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 600 }}>Coincidencia del mapa</span>
        <span style={{
          background: c.score >= 90 ? '#2d8a4e' : c.score >= 75 ? '#f59e0b' : '#185fa5',
          color: '#fff', borderRadius: 20, padding: '2px 10px', fontWeight: 700, fontSize: '0.82rem',
        }}>{c.score}%</span>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem' }}>{EMOJI[p.especie?.toUpperCase()] || '🐾'}</div>
          <strong style={{ fontSize: '0.82rem' }}>{p.nombre || 'Perdida'}</strong>
          <div style={{ fontSize: '0.72rem', color: '#888' }}>{p.raza || ''}</div>
          <span style={{ fontSize: '0.68rem', background: '#fee2e2', color: '#b91c1c', borderRadius: 6, padding: '1px 6px' }}>PERDIDA</span>
        </div>
        <span style={{ fontSize: '1.2rem', color: '#aaa' }}>↔</span>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem' }}>{EMOJI[e.especie?.toUpperCase()] || '🐾'}</div>
          <strong style={{ fontSize: '0.82rem' }}>{e.nombre || 'Encontrada'}</strong>
          <div style={{ fontSize: '0.72rem', color: '#888' }}>{e.raza || ''}</div>
          <span style={{ fontSize: '0.68rem', background: '#dcfce7', color: '#166534', borderRadius: 6, padding: '1px 6px' }}>ENCONTRADA</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleConfirmar} disabled={confirmando}
          style={{ flex: 1, padding: '7px 0', borderRadius: 8, background: '#2d8a4e', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
          {confirmando ? '...' : '✅ Confirmar reunión'}
        </button>
        <button onClick={() => onDescartar(c.id)}
          style={{ padding: '7px 14px', borderRadius: 8, background: '#f3f4f6', color: '#666', border: 'none', fontSize: '0.82rem', cursor: 'pointer' }}>
          Descartar
        </button>
      </div>
    </div>
  );
}

// ── Tab principal ─────────────────────────────────────────────────────
export default function TabCoincidencias() {
  const { state, dispatch } = useAppContext();
  const { coincidencias, notificaciones } = state;

  const notifDB = (() => {
    const base = notificaciones.filter(
      n => n.tipo === 'nueva_coincidencia' && n._dbId && n.mascotaIdPerdida && n.mascotaIdCandidata
    );
    const mejorPorCandidata = new Map();
    base.forEach(n => {
      const prev = mejorPorCandidata.get(n.mascotaIdCandidata);
      if (!prev || (n.porcentaje ?? 0) > (prev.porcentaje ?? 0)) {
        mejorPorCandidata.set(n.mascotaIdCandidata, n);
      }
    });
    return Array.from(mejorPorCandidata.values());
  })();

  const confirmarReunion = async (c) => {
    const perdidaMascotaId = c.mascota_perdida.mascotaId;
    const encontradaMascotaId = c.mascota_encontrada.mascotaId;
    // Fallback al ID del reporte si no hay mascotaId (ej. mascota creada sin reporte vinculado)
    const perdidaKey = perdidaMascotaId ?? c.mascota_perdida.id;
    const encontradaKey = encontradaMascotaId ?? c.mascota_encontrada.id;
    console.log('[Reunion Socket] confirmarReunion() llamado', {
      perdidaMascotaId,
      encontradaMascotaId,
      perdidaKey,
      encontradaKey,
      coincidenciaId: c.id,
    });
    if (!perdidaKey) {
      console.warn('[Reunion Socket] perdidaKey es null/undefined — retornando sin acción');
      return;
    }

    dispatch({ type: 'MASCOTA_REUNIDA', payload: perdidaKey });
    dispatch({ type: 'QUITAR_COINCIDENCIA', payload: c.id });
    if (encontradaKey) {
      dispatch({ type: 'MASCOTA_REUNIDA', payload: encontradaKey });
    }
    dispatch({
      type: 'ADD_NOTIFICACION',
      payload: {
        id: `reunion_${perdidaKey}_${Date.now()}`,
        tipo: 'mascota_reunida',
        titulo: '¡Tu mascota llegó a casa!',
        mensaje: c.mascota_perdida.nombre && c.mascota_perdida.nombre !== 'Sin nombre'
          ? `${c.mascota_perdida.nombre} fue reunida con éxito. ¡Que alegría!`
          : 'Confirmaste la reunión de tu mascota. ¡Que alegría!',
        timestamp: new Date().toISOString(),
        leida: false,
      },
    });
    dispatch({ type: 'SET_TAB', payload: 'notif' });

    const calls = [];
    if (perdidaMascotaId) {
      calls.push(
        fetch(`/api/mascotas/${perdidaMascotaId}/estado`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: 'REUNIDO' }),
        }).then(r => console.log('[Reunion Socket] PUT estado perdida:', r.status)).catch(e => console.warn('[Reunion Socket] PUT estado perdida error:', e)),
        fetch(`/api/reportes/mascota/${perdidaMascotaId}`, { method: 'DELETE' }).catch(() => {}),
      );
    } else if (c.mascota_perdida.id) {
      calls.push(fetch(`/api/reportes/${c.mascota_perdida.id}`, { method: 'DELETE' }).catch(() => {}));
    }
    if (encontradaMascotaId) {
      calls.push(
        fetch(`/api/mascotas/${encontradaMascotaId}/estado`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: 'REUNIDO' }),
        }),
        fetch(`/api/reportes/mascota/${encontradaMascotaId}`, { method: 'DELETE' }).catch(() => {}),
      );
    } else if (c.mascota_encontrada.id) {
      calls.push(fetch(`/api/reportes/${c.mascota_encontrada.id}`, { method: 'DELETE' }).catch(() => {}));
    }
    Promise.allSettled(calls);
  };

  const descartar = (id) => dispatch({ type: 'QUITAR_COINCIDENCIA', payload: id });

  const hayContenido = notifDB.length > 0 || coincidencias.length > 0;

  if (!hayContenido) {
    return (
      <div className="tab-vacio">
        <span style={{ fontSize: '2.5rem' }}>🔍</span>
        <p>Sin coincidencias activas</p>
        <small>El sistema busca coincidencias automáticamente cuando registras una mascota</small>
      </div>
    );
  }

  return (
    <div style={{ padding: '4px 0' }}>
      {notifDB.length > 0 && (
        <>
          <p style={{ fontSize: '0.75rem', color: '#888', margin: '0 0 10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Coincidencias de tus mascotas
          </p>
          {notifDB.map(n => (
            <CardCoincidenciaDB key={n._dbId} notif={{
              id: n._dbId,
              mascotaIdPerdida:   n.mascotaIdPerdida  || n.mascota_id,
              mascotaIdCandidata: n.mascotaIdCandidata || n.mascota_candidata_id,
              porcentaje: n.porcentaje || 0,
            }} />
          ))}
        </>
      )}

      {coincidencias.length > 0 && (
        <>
          {notifDB.length > 0 && (
            <p style={{ fontSize: '0.75rem', color: '#888', margin: '12px 0 10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Coincidencias generales
            </p>
          )}
          {coincidencias.map(c => (
            <CardCoincidenciaSocket
              key={c.id} c={c}
              onConfirmar={confirmarReunion}
              onDescartar={descartar}
            />
          ))}
        </>
      )}
    </div>
  );
}
