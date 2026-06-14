import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ESPECIES, COLORES } from '../constants/enums';

// Pin de clic — círculo rojo sólido para marcar el lugar del reporte
const pinIcon = L.divIcon({
  html: '<div style="width:22px;height:22px;background:#e24b4a;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(226,75,74,.5)"></div>',
  className: '',
  iconSize: [22, 22], iconAnchor: [11, 11],
});

// Icono de ubicación actual — igual al mapa principal
const miUbicIcon = L.divIcon({
  html: '<div style="font-size:30px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))">📍</div>',
  className: '',
  iconSize: [30, 40], iconAnchor: [15, 40],
});

function MapaSelector({ onSelect }) {
  useMapEvents({ click(e) { onSelect([e.latlng.lat, e.latlng.lng]); } });
  return null;
}

function CentrarEnUbicacion({ pos }) {
  const map = useMap();
  useEffect(() => { if (pos) map.flyTo(pos, 15, { duration: 1 }); }, [pos]);
  return null;
}

function emoji(esp) {
  const e = String(esp || '').toUpperCase();
  return e === 'PERRO' ? '🐕' : e === 'GATO' ? '🐈' : '🐾';
}

export default function ReportarPerdida({ onClose, onExito }) {
  const [mascotas, setMascotas] = useState([]);
  const [logueado, setLogueado] = useState(false);
  const [elegida, setElegida] = useState(null);
  const [coordenadas, setCoordenadas] = useState(null);
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [coincidencias, setCoincidencias] = useState([]);

  useEffect(() => {
    const u = (() => { try { return JSON.parse(localStorage.getItem('usuario') || 'null'); } catch { return null; } })();
    const uid = u?.user?.id;
    if (!uid) { setLogueado(false); return; }
    setLogueado(true);
    fetch(`/api/mascotas/usuario/${uid}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setMascotas(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => setMiUbicacion([p.coords.latitude, p.coords.longitude]),
      () => {}
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!elegida) { setError('Selecciona una mascota.'); return; }
    if (!coordenadas) { setError('Marca la ubicación en el mapa.'); return; }

    const u = (() => { try { return JSON.parse(localStorage.getItem('usuario') || 'null'); } catch { return null; } })();
    const token = u?.token;
    const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

    setEnviando(true);
    try {
      // 1. Actualizar estado a PERDIDO
      await fetch(`/api/mascotas/${elegida.id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'PERDIDO' }),
      });

      // 2. Crear reporte en el servicio de reportes (para que aparezca en el mapa)
      const reporte = {
        descripcion: notas || `Mascota perdida: ${elegida.nombre}`,
        fechaReporte: fecha,
        img: '',
        estado: 'PERDIDO',
        ubicacion: { latitude: coordenadas[0], longitude: coordenadas[1] },
        usuarioId: u?.user?.id ? Number(u.user.id) : null,
        mascotaId: Number(elegida.id),
      };
      await fetch('/api/reportes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reporte),
      });

      // 3. Buscar coincidencias en FastAPI
      const res = await fetch('/api/coincidencias', {
        headers: authHeader,
      });
      if (res.ok) {
        const data = await res.json();
        const matches = (data.coincidencias || []).filter(c =>
          String(c.mascota_perdida?.id) === String(elegida.id)
        );
        if (matches.length > 0) {
          setCoincidencias(matches);
          setEnviando(false);
          return;
        }
      }

      // onExito muestra el éxito y cierra solo tras 2.5s; no llamar onClose aquí.
      onExito?.(`Reporte de pérdida de ${elegida.nombre} enviado.`);
    } catch (err) {
      setError('Error al enviar el reporte.');
    } finally {
      setEnviando(false);
    }
  };

  if (coincidencias.length > 0) {
    return (
      <div className="nr-form">
        <div className="nr-coincidencias-box" style={{ position: 'static', boxShadow: 'none', padding: 0 }}>
          <h3>¡Encontramos posibles coincidencias!</h3>
          {coincidencias.map(c => {
            const e = c.mascota_encontrada;
            return (
              <div key={c.id} className="nr-coinc-card">
                <div>
                  <div style={{ fontWeight: 700 }}>{emoji(e.especie)} {e.nombre || 'Sin nombre'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {e.raza && `${e.raza} · `}
                    {COLORES[e.color]?.label || e.color || ''}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 4 }}>
                    Criterios: {c.criterios?.join(', ')}
                  </div>
                </div>
                <span className="nr-score-badge">{c.score}%</span>
              </div>
            );
          })}
          <button className="nr-submit" onClick={() => { onExito?.('Reporte enviado. Revisa las coincidencias.'); onClose(); }}>
            Ver en el mapa
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="nr-form" onSubmit={handleSubmit}>
      {/* Paso 1: Seleccionar mascota */}
      <div className="nr-group">
        <label className="nr-label">Selecciona tu mascota</label>
        {!logueado
          ? <p style={{ color: '#c0392b', fontSize: '0.9rem', fontWeight: 600 }}>
              Debes iniciar sesión para reportar una mascota perdida.
            </p>
          : mascotas.length === 0
          ? <p style={{ color: '#888', fontSize: '0.85rem' }}>
              No tienes mascotas registradas. Usa "Registrar Mascota" en el menú primero.
            </p>
          : (
            <div className="nr-mascota-cards">
              {mascotas.map(m => (
                <div key={m.id} className={`nr-mascota-card ${elegida?.id === m.id ? 'elegida' : ''}`}
                  onClick={() => setElegida(m)}>
                  <span className="nr-mascota-emoji">{emoji(m.especie)}</span>
                  <div className="nr-mascota-info">
                    <div className="nr-mascota-nombre">{m.nombre}</div>
                    <div className="nr-mascota-sub">{m.raza} · {COLORES[m.color]?.label || m.color || ''}</div>
                  </div>
                  {elegida?.id === m.id && <span style={{ color: '#2d8a4e', fontWeight: 700 }}>✓</span>}
                </div>
              ))}
            </div>
          )
        }
      </div>

      {elegida && (
        <div className="nr-banner-sel">
          ✓ Datos de {elegida.nombre} ya guardados — no necesitas volver a ingresarlos
        </div>
      )}

      {/* Paso 2: Ubicación */}
      <div className="nr-group">
        <label className="nr-label">¿Dónde la viste por última vez?</label>
        <div style={{ height: 260, borderRadius: 10, overflow: 'hidden', border: '1.5px solid #d1d5db' }}>
          <MapContainer center={miUbicacion || coordenadas || [-33.5167, -70.7617]} zoom={14}
            style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <CentrarEnUbicacion pos={miUbicacion} />
            <MapaSelector onSelect={setCoordenadas} />
            {miUbicacion && (
              <>
                <Marker position={miUbicacion} icon={miUbicIcon} />
                <Circle center={miUbicacion} radius={300}
                  pathOptions={{ color: '#27ae60', fillColor: '#27ae60', fillOpacity: 0.08, weight: 1.5 }} />
              </>
            )}
            {coordenadas && <Marker position={coordenadas} icon={pinIcon} />}
          </MapContainer>
        </div>
        {miUbicacion && !coordenadas && (
          <span style={{ fontSize: '0.72rem', color: '#555' }}>📍 Tu ubicación · haz clic en el mapa para marcar el lugar exacto</span>
        )}
        {coordenadas && (
          <span style={{ fontSize: '0.75rem', color: '#666' }}>
            {coordenadas[0].toFixed(5)}, {coordenadas[1].toFixed(5)}
          </span>
        )}
      </div>

      {/* Fecha y hora */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="nr-group">
          <label className="nr-label">Fecha de pérdida *</label>
          <input type="date" className="nr-input" value={fecha} onChange={e => setFecha(e.target.value)} required />
        </div>
        <div className="nr-group">
          <label className="nr-label">Hora aproximada</label>
          <input type="time" className="nr-input" value={hora} onChange={e => setHora(e.target.value)} />
        </div>
      </div>

      {/* Notas */}
      <div className="nr-group">
        <label className="nr-label">¿Qué pasó? (opcional)</label>
        <textarea className="nr-textarea" value={notas} onChange={e => setNotas(e.target.value)}
          placeholder="¿Cómo se escapó? ¿Hay algo que ayude a encontrarla?" maxLength={300} />
      </div>

      {error && <p className="nr-error">{error}</p>}

      <button type="submit" className="nr-submit" disabled={enviando || !elegida}>
        {enviando ? 'Enviando...' : 'Activar búsqueda'}
      </button>
    </form>
  );
}
