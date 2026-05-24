import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/MapaInteractivo.css';
import { mascotasPerdidas as mascotasEjemplo } from '../js/datos_mascotas';
import { useEffect, useRef, useState } from 'react';
import ModalReporte from './ModalReporte';


// Icono personalizado para los marcadores
const createCustomIcon = (especie) => {
  const emoji = especie === 'Perro' ? '🐕' : '🐈';
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
  // Estado para la ubicación del usuario
  const [userLocation, setUserLocation] = useState(null);
  // Estado para el reporte seleccionado (para el modal)
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  // Estado para los reportes (fijos en Maipú si no hay ubicación)
  const [mascotas] = useState(mascotasEjemplo);
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
          <Marker
            key={mascota.id}
            position={[mascota.ubicacion.latitude, mascota.ubicacion.longitude]}
            icon={createCustomIcon(mascota.especie)}
            eventHandlers={{
              click: () => setReporteSeleccionado(mascota),
            }}
          />
        ))}
      </MapContainer>
      <ModalReporte open={!!reporteSeleccionado} onClose={() => setReporteSeleccionado(null)} mascota={reporteSeleccionado} />
      <div className="mapa-info">
        <p>
          Total de mascotas reportadas: <strong>{mascotas.length}</strong>
        </p>
      </div>
    </div>
  );
}
