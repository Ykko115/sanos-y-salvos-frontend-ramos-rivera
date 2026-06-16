import { Fragment, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/MapaInteractivo.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import ModalReporte from './ModalReporte';

// ── Constantes ────────────────────────────────────────────────────

const ESTADO_COLOR = {
  PERDIDO:    '#e24b4a',
  ENCONTRADO: '#2d8a4e',
  REUNIDO:    '#9ca3af',
};

function getEmoji(especie) {
  const e = String(especie || '').toUpperCase();
  if (e === 'PERRO')  return '🐕';
  if (e === 'GATO')   return '🐈';
  if (e === 'ROEDOR') return '🐹';
  return '🐾';
}

// ── Iconos ────────────────────────────────────────────────────────

const createPetIcon = (especie, estado) => {
  const emoji = getEmoji(especie);
  const color = ESTADO_COLOR[String(estado || '').toUpperCase()] || '#e24b4a';
  return L.divIcon({
    className: '',
    html: `<div style="background:white;border:3px solid ${color};border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${emoji}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -24],
  });
};

const createPulsingIcon = (tipo) => {
  const cls   = tipo === 'perdida' ? 'pin-perdida-coincidencia' : 'pin-encontrada-coincidencia';
  const emoji = tipo === 'perdida' ? '🐾' : '🔍';
  return L.divIcon({
    html: `<div class="${cls}">${emoji}</div>`,
    className: 'custom-icon',
    iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, -26],
  });
};

const createLabelIcon = (texto) => L.divIcon({
  html: `<div class="label-coincidencia">${texto}</div>`,
  className: '',
  iconSize: null, iconAnchor: [40, 12],
});

const userLocationIcon = L.divIcon({
  html: '<div class="custom-marker user-marker">📍</div>',
  className: 'custom-icon',
  iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -20],
});

// ── Helpers ───────────────────────────────────────────────────────

function midpoint(lat1, lng1, lat2, lng2) {
  return [(lat1 + lat2) / 2, (lng1 + lng2) / 2];
}

// ── Componente principal ──────────────────────────────────────────

export default function MapaInteractivo() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { state, dispatch } = useAppContext();
  const { coincidencias, mascotasReunidas } = state;

  const [userLocation,    setUserLocation]    = useState(null);
  const [mascotas,        setMascotas]        = useState([]);
  const [geoError,        setGeoError]        = useState(null);
  const [selectedMascota, setSelectedMascota] = useState(null);
  const mapRef = useRef();

  // Fetch reportes + mascotas y combina por mascotaId
  const fetchData = () => {
    Promise.all([
      fetch('/api/reportes').then(r => r.ok ? r.json() : []),
      fetch('/api/mascotas').then(r => r.ok ? r.json() : []),
    ]).then(([reportesData, mascotasData]) => {
      // Construye lookup id → mascota
      const mascotaById = {};
      if (Array.isArray(mascotasData)) {
        mascotasData.forEach(item => {
          const m = item?.mascota || item;
          if (m?.id) mascotaById[String(m.id)] = m;
        });
      }

      const norm = Array.isArray(reportesData)
        ? reportesData.map(raw => {
            if (!raw) return null;
            const mascotaId = raw.mascotaId || raw.mascota_id;
            const m = mascotaById[String(mascotaId)] || null;
            // Si la mascota ya fue reunida, usar ese estado para que el filtro la excluya
            const estado = m?.estado === 'REUNIDO' ? 'REUNIDO' : (raw.estado || m?.estado || null);
            return {
              ...raw,
              estado,
              id:      raw.id || raw.reporteId || null,
              ubicacion: raw.ubicacion || null,
              especie:   m?.especie   || raw.especie   || null,
              nombre:    m?.nombre    || raw.nombre_mascota || null,
              raza:      m?.raza      || raw.raza      || null,
              color:     m?.color     || raw.color     || null,
              tamano:    m?.tamano    || raw.tamano     || null,
              senas:     m?.senas     || raw.senas      || [],
              fotoUrl:   m?.fotoUrl   || raw.img        || null,
              telefono:  raw.telefono || null,
              mascota:   m,
            };
          }).filter(Boolean)
        : [];

      setMascotas(norm);
      dispatch({ type: 'SET_MASCOTAS', payload: norm });
    }).catch(() => {});
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 10000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Geolocalización del usuario
  useEffect(() => {
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        pos => { setUserLocation([pos.coords.latitude, pos.coords.longitude]); setGeoError(null); },
        ()  => { setUserLocation(null); setGeoError('No se pudo obtener tu ubicación precisa.'); },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, []);

  const perdidaIdSet   = new Set(coincidencias.map(c => String(c.mascota_perdida.id)));
  const encontradaIdSet = new Set(coincidencias.map(c => String(c.mascota_encontrada.id)));

  const abrirSidebar = () => {
    dispatch({ type: 'ABRIR_SIDEBAR' });
    dispatch({ type: 'SET_TAB', payload: 'coincidencias' });
  };

  const coordenadasCentro = userLocation || [-33.5167, -70.7617];
  const reunidasSet = new Set((mascotasReunidas || []).map(String));
  const visibles = mascotas.filter(m =>
    String(m.estado || '').toUpperCase() !== 'REUNIDO' &&
    !reunidasSet.has(String(m.id)) &&
    !reunidasSet.has(String(m.mascotaId ?? m.mascota_id)) &&
    !reunidasSet.has(String(m.mascota?.id))
  );

  return (
    <div className="mapa-container">
      <div className="mapa-header">
        <h2>🗺️ Mapa de Mascotas Perdidas</h2>
        <p>Haz clic en los marcadores para ver los detalles</p>
        {geoError && <p style={{ color: '#ff5252', fontWeight: 'bold' }}>{geoError}</p>}
      </div>

      <MapContainer
        center={coordenadasCentro}
        zoom={userLocation ? 15 : 13}
        scrollWheelZoom={true}
        className="mapa-leaflet"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Ubicación del usuario */}
        {userLocation && (
          <>
            <Marker position={userLocation} icon={userLocationIcon} />
            <Circle center={userLocation} radius={500}
              pathOptions={{ color: '#27ae60', fillOpacity: 0.08, weight: 1.5 }} />
          </>
        )}

        {/* Marcadores de mascotas (solo PERDIDO y ENCONTRADO) */}
        {visibles.map(mascota => {
          if (!mascota.ubicacion?.latitude || !mascota.ubicacion?.longitude) return null;

          const pos    = [mascota.ubicacion.latitude, mascota.ubicacion.longitude];
          const idStr  = String(mascota.id);
          const estado = String(mascota.estado || 'PERDIDO').toUpperCase();
          const esPerdida    = perdidaIdSet.has(idStr);
          const esEncontrada = encontradaIdSet.has(idStr);
          const tieneCoincidencia = esPerdida || esEncontrada;

          const estadoColor = ESTADO_COLOR[estado] || '#e24b4a';
          const icon   = tieneCoincidencia
            ? createPulsingIcon(esPerdida ? 'perdida' : 'encontrada')
            : createPetIcon(mascota.especie, estado);


          return (
            <Fragment key={mascota.id}>
              {/* Círculo de zona de búsqueda */}
              <Circle
                center={pos}
                radius={500}
                pathOptions={{
                  color:       estadoColor,
                  fillColor:   estadoColor,
                  fillOpacity: 0.08,
                  weight:      2,
                  dashArray:   '6, 4',
                }}
              />

              {/* Pin — abre ModalReporte al hacer click */}
              <Marker
                position={pos}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    if (tieneCoincidencia) abrirSidebar();
                    setSelectedMascota(mascota);
                  },
                }}
              />
            </Fragment>
          );
        })}

        {/* Capas de coincidencias: líneas + pines pulsantes + labels */}
        {coincidencias.map(c => {
          const { mascota_perdida: p, mascota_encontrada: e } = c;
          if (p.lat == null || e.lat == null) return null;
          const mid = midpoint(p.lat, p.lng, e.lat, e.lng);
          return (
            <Fragment key={c.id}>
              <Marker position={[p.lat, p.lng]} icon={createPulsingIcon('perdida')}    eventHandlers={{ click: abrirSidebar }} />
              <Marker position={[e.lat, e.lng]} icon={createPulsingIcon('encontrada')} eventHandlers={{ click: abrirSidebar }} />
              <Polyline
                positions={[[p.lat, p.lng], [e.lat, e.lng]]}
                pathOptions={{ color: '#f59e0b', dashArray: '8, 6', weight: 2.5, opacity: 0.9, className: 'linea-coincidencia' }}
              />
              <Marker position={mid} icon={createLabelIcon(`${c.score}% coincidencia`)} eventHandlers={{ click: abrirSidebar }} />
            </Fragment>
          );
        })}
      </MapContainer>

      <div className="mapa-info">
        <p>
          Total de mascotas reportadas: <strong>{visibles.length}</strong>
          {coincidencias.length > 0 && (
            <span style={{ marginLeft: 12, color: '#f59e0b', fontWeight: 700 }}>
              • {coincidencias.length} coincidencia{coincidencias.length !== 1 ? 's' : ''} activa{coincidencias.length !== 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

      <ModalReporte
        open={!!selectedMascota}
        onClose={() => setSelectedMascota(null)}
        mascota={selectedMascota}
      />
    </div>
  );
}
