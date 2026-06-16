import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ESPECIES, COLORES, TAMANOS, PELAJES, RANGOS_EDAD, SENAS } from '../constants/enums';

// Pin de clic — círculo verde para marcar donde se encontró la mascota
const pinIcon = L.divIcon({
  html: '<div style="width:22px;height:22px;background:#2d8a4e;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(45,138,78,.5)"></div>',
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

const INIT = {
  nombre: '', telefono: '', especie: '', raza: '', color: '', tamano: '',
  pelaje: '', rangoEdad: 'NO_SE', senas: [], descripcion: '',
  fotoUrl: '', lat: null, lng: null, estado: 'ENCONTRADO', usuarioId: null,
};

function ColorCirculo({ clave, activo, onClick }) {
  const { label, hex } = COLORES[clave];
  return (
    <button type="button" title={label}
      className={`nr-color-btn ${activo ? 'activo' : ''}`}
      style={{ background: hex || '#e5e7eb', border: hex === '#f5f5f0' ? '1px solid #d1d5db' : undefined }}
      onClick={() => onClick(clave)}>
      {!hex && '?'}
    </button>
  );
}

export default function ReportarEncontrada({ onClose, onExito }) {
  const [form, setForm] = useState(INIT);
  const [preview, setPreview] = useState('');
  const [analizando, setAnalizando] = useState(false);
  const [iaBadge, setIaBadge] = useState('');
  const [coordenadas, setCoordenadas] = useState(null);
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [coincidencias, setCoincidencias] = useState([]);
  const fileRef = useRef();

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => setMiUbicacion([p.coords.latitude, p.coords.longitude]),
      () => {}
    );
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleSena = (s) =>
    setForm(f => ({ ...f, senas: f.senas.includes(s) ? f.senas.filter(x => x !== s) : [...f.senas, s] }));

  const handleFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    setAnalizando(true);
    setIaBadge('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('http://localhost:8000/api/ia/analizar-foto', { method: 'POST', body: fd });
      if (res.ok) {
        const ia = await res.json();
        setForm(f => ({
          ...f,
          especie: ia.especie || f.especie,
          raza: ia.raza || f.raza,
          color: ia.color || f.color,
          tamano: ia.tamano || f.tamano,
        }));
        setIaBadge(
          `IA detectó: ${ia.especie} · ${ia.raza} · ${COLORES[ia.color]?.label || ia.color} ` +
          `— confirma o corrige (${Math.round((ia.confianza || 0) * 100)}% confianza)`
        );
      }
    } catch {
      setIaBadge('No se pudo analizar la imagen automáticamente.');
    } finally {
      setAnalizando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nombre.trim()) { setError('Tu nombre es obligatorio.'); return; }
    if (!form.telefono.trim()) { setError('El teléfono es obligatorio.'); return; }
    if (!coordenadas) { setError('Marca la ubicación en el mapa.'); return; }

    setEnviando(true);
    try {
      const payload = {
        nombre: form.especie ? null : form.nombre,
        especie: form.especie || null,
        raza: form.raza || null,
        color: form.color || null,
        tamano: form.tamano || null,
        pelaje: form.pelaje || null,
        rangoEdad: form.rangoEdad || 'NO_SE',
        senas: form.senas.length ? form.senas : null,
        descripcion: form.descripcion || null,
        fotoUrl: form.fotoUrl || null,
        lat: coordenadas[0],
        lng: coordenadas[1],
        estado: 'ENCONTRADO',
        usuarioId: null,
      };

      const res = await fetch('/api/mascotas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error al registrar.');

      const created = await res.json();
      const mascotaId = created.id;

      // Buscar coincidencias
      const coinRes = await fetch('/api/coincidencias');
      if (coinRes.ok) {
        const data = await coinRes.json();
        const matches = (data.coincidencias || []).filter(c =>
          String(c.mascota_encontrada?.id) === String(mascotaId)
        );
        if (matches.length > 0) {
          setCoincidencias(matches);
          setEnviando(false);
          return;
        }
      }

      onExito?.('Mascota encontrada registrada. ¡Gracias por ayudar!');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (coincidencias.length > 0) {
    return (
      <div className="nr-form">
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: '2rem' }}>🎉</span>
          <h3 style={{ color: '#2d8a4e', margin: '8px 0' }}>¡Encontramos una posible coincidencia!</h3>
        </div>
        {coincidencias.map(c => {
          const p = c.mascota_perdida;
          return (
            <div key={c.id} className="nr-coinc-card">
              <div>
                <div style={{ fontWeight: 700 }}>🐾 {p.nombre || 'Sin nombre'}</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>{p.raza} · {COLORES[p.color]?.label || p.color || ''}</div>
                <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 4 }}>
                  Criterios: {c.criterios?.join(', ')}
                </div>
              </div>
              <span className="nr-score-badge">{c.score}%</span>
            </div>
          );
        })}
        <p style={{ fontSize: '0.82rem', color: '#555', textAlign: 'center' }}>
          El dueño de la mascota perdida ha sido notificado.
        </p>
        <button className="nr-submit" onClick={() => { onExito?.('Registro exitoso.'); onClose(); }}>
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <form className="nr-form" onSubmit={handleSubmit}>
      {/* Tu nombre y teléfono */}
      <div className="nr-group">
        <label className="nr-label">Tu nombre *</label>
        <input className="nr-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="¿Cómo te llamas?" required />
      </div>
      <div className="nr-group">
        <label className="nr-label">Tu teléfono *</label>
        <input className="nr-input" type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+56 9 1234 5678" required />
      </div>

      {/* Foto con análisis IA */}
      <div className="nr-group">
        <label className="nr-label">Foto de la mascota *</label>
        <input type="file" accept="image/*" ref={fileRef} onChange={handleFoto} className="nr-input" />
        {preview && <img src={preview} alt="preview" className="nr-foto-preview" />}
        {analizando && (
          <div className="nr-ia-badge">
            <span className="nr-ia-spinner">⏳</span> Analizando imagen...
          </div>
        )}
        {iaBadge && !analizando && (
          <div className="nr-ia-badge">{iaBadge}</div>
        )}
      </div>

      {/* Especie */}
      <div className="nr-group">
        <label className="nr-label">Especie</label>
        <select className="nr-select" value={form.especie} onChange={e => set('especie', e.target.value)}>
          <option value="">No estoy seguro/a</option>
          {Object.entries(ESPECIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Raza */}
      <div className="nr-group">
        <label className="nr-label">Raza (si la conoces)</label>
        <input className="nr-input" value={form.raza} onChange={e => set('raza', e.target.value)} placeholder="Ej: Labrador, Siamés..." />
      </div>

      {/* Color */}
      <div className="nr-group">
        <label className="nr-label">Color predominante</label>
        <div className="nr-paleta">
          {Object.keys(COLORES).map(k => (
            <ColorCirculo key={k} clave={k} activo={form.color === k} onClick={v => set('color', form.color === v ? '' : v)} />
          ))}
        </div>
      </div>

      {/* Tamaño */}
      <div className="nr-group">
        <label className="nr-label">Tamaño</label>
        <div className="nr-btn-group">
          {Object.entries(TAMANOS).map(([k, v]) => (
            <button key={k} type="button" className={`nr-btn-sel ${form.tamano === k ? 'activo' : ''}`}
              onClick={() => set('tamano', form.tamano === k ? '' : k)}>{v}</button>
          ))}
        </div>
      </div>

      {/* Pelaje */}
      <div className="nr-group">
        <label className="nr-label">Pelaje</label>
        <div className="nr-btn-group">
          {Object.entries(PELAJES).map(([k, v]) => (
            <button key={k} type="button" className={`nr-btn-sel ${form.pelaje === k ? 'activo' : ''}`}
              onClick={() => set('pelaje', form.pelaje === k ? '' : k)}>{v}</button>
          ))}
        </div>
      </div>

      {/* Rango edad */}
      <div className="nr-group">
        <label className="nr-label">Rango de edad aproximado</label>
        <div className="nr-btn-group">
          {Object.entries(RANGOS_EDAD).map(([k, v]) => (
            <button key={k} type="button" className={`nr-btn-sel ${form.rangoEdad === k ? 'activo' : ''}`}
              onClick={() => set('rangoEdad', k)}>{v}</button>
          ))}
        </div>
      </div>

      {/* Señas */}
      <div className="nr-group">
        <label className="nr-label">Señas que puedes ver</label>
        <div className="nr-senas-grid">
          {Object.entries(SENAS).map(([k, v]) => (
            <label key={k} className="nr-sena-item">
              <input type="checkbox" checked={form.senas.includes(k)} onChange={() => toggleSena(k)} />
              {v}
            </label>
          ))}
        </div>
      </div>

      {/* Ubicación */}
      <div className="nr-group">
        <label className="nr-label">¿Dónde la encontraste?</label>
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

      {/* Notas */}
      <div className="nr-group">
        <label className="nr-label">Notas adicionales</label>
        <textarea className="nr-textarea" value={form.descripcion}
          onChange={e => set('descripcion', e.target.value)}
          placeholder="¿Dónde exactamente? ¿Tiene collar? ¿Se veía asustada?" />
      </div>

      {error && <p className="nr-error">{error}</p>}

      <button type="submit" className="nr-submit" disabled={enviando}>
        {enviando ? 'Registrando...' : 'Registrar mascota encontrada'}
      </button>
    </form>
  );
}
