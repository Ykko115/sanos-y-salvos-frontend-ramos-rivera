import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/MapaInteractivo.css';
// import { mascotasPerdidas as mascotasEjemplo } from '../js/datos_mascotas';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';


const normalizeReporte = (raw) => {
  if (!raw) return null;

  const reporte = raw.reporte || raw;
  const mascotaWrapper = raw.mascota || null;
  const mascotaData = mascotaWrapper?.mascota || mascotaWrapper || null;
  const usuarioWrapper = raw.usuario || mascotaWrapper?.usuario || null;
  const usuarioData = usuarioWrapper?.usuario || usuarioWrapper || null;

  const ubicacion = reporte.ubicacion || mascotaData?.ubicacion || raw.ubicacion || null;
  const id = reporte.id || raw.id || mascotaData?.id || reporte.reporteId || raw.reporteId || null;

  return {
    ...reporte,
    ...(mascotaData || {}),
    id,
    ubicacion,
    usuario: usuarioData,
    reporte,
    mascota: mascotaData,
  };
};

const getReporteId = (m) => {
  return (
    m?.id ||
    m?.reporteId || m?.reporte_id || m?.reportId || m?.report_id || m?.idReporte || m?.id_reporte ||
    m?.reporte?.id || m?.reporte?.reportId || null
  );
};

const encodeReporteId = (id) => {
  try {
    return encodeURIComponent(btoa(String(id)));
  } catch {
    return String(id);
  }
};


// Icono personalizado para los marcadores
const createCustomIcon = (especie) => {
  const especieNormalizada = String(especie || '').toLowerCase();
  const emoji = especieNormalizada.includes('perro') ? '🐕' : '🐈';
  return L.divIcon({
    html: `<div class="custom-marker">${emoji}</div>`,
    className: 'custom-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

// Icono para la ubicación del usuario
const userLocationIcon = L.divIcon({
  html: '<div class="custom-marker user-marker">📍</div>',
  className: 'custom-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});


export default function MapaInteractivo() {
  const navigate = useNavigate();
  const location = useLocation();
  // Estado para la ubicación del usuario
  const [userLocation, setUserLocation] = useState(null);
  // Estado para los reportes obtenidos del backend
  const [mascotas, setMascotas] = useState([]);
    // Función para obtener reportes desde el backend
    const fetchReportes = () => {
      fetch('http://localhost:8080/api/reportes')
        .then(res => {
          if (!res.ok) throw new Error('Error al obtener reportes');
          return res.json();
        })
        .then(data => {
          const normalizados = Array.isArray(data) ? data.map(normalizeReporte).filter(Boolean) : [];
          setMascotas(normalizados);
        })
        .catch(() => {
          setMascotas([]);
        });
    };

    // Obtener reportes al montar y cada 10 segundos
    useEffect(() => {
      fetchReportes();
      const intervalId = setInterval(fetchReportes, 10000);
      return () => clearInterval(intervalId);
    }, []);
  // Estado para error de ubicación
  const [geoError, setGeoError] = useState(null);

  // Obtener ubicación del usuario en tiempo real
  useEffect(() => {
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(coords);
          setGeoError(null);
        },
        () => {
          setUserLocation(null);
          setGeoError('No se pudo obtener tu ubicación precisa.');
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  
  const coordenadasCentro = userLocation || [-33.5167, -70.7617];

  const mapRef = useRef();

  return (
    <div className="mapa-container">
      <div className="mapa-header">
        <h2>🗺️ Mapa de Mascotas Perdidas</h2>
        <p>Haz clic en los marcadores para ver los detalles</p>
        {geoError && <p style={{color:'#ff5252', fontWeight:'bold'}}>{geoError}</p>}
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
          <Marker position={userLocation} icon={userLocationIcon} />
        )}
        {userLocation && (
          <Circle center={userLocation} radius={500} pathOptions={{ color: '#27ae60', fillOpacity: 0.1 }} />
        )}

        {/* Marcadores para cada mascota */}
        {mascotas.map((mascota) => (
          mascota.ubicacion && mascota.ubicacion.latitude != null && mascota.ubicacion.longitude != null ? (
            <Marker
              key={mascota.id}
              position={[mascota.ubicacion.latitude, mascota.ubicacion.longitude]}
              icon={createCustomIcon(mascota.especie || mascota.tipo || mascota.mascota?.especie || 'Perro')}
              eventHandlers={{
                click: () => {
                  const reporteId = getReporteId(mascota);
                  if (!reporteId) return;
                  const encodedId = encodeReporteId(reporteId);
                  navigate(`/modalreporte/${encodedId}`, { state: { backgroundLocation: location } });
                },
              }}
            />
          ) : null
        ))}
      </MapContainer>
      <div className="mapa-info">
        <p>
          Total de mascotas reportadas: <strong>{mascotas.length}</strong>
        </p>
      </div>
    </div>
  );
}
