import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import "../css/ModalReporte.css";


// Icono personalizado para el pin
const pinIcon = L.divIcon({
  html: '<div class="custom-marker">📍</div>',
  className: 'custom-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -20]
});

function MapaSelector({ onSelect, markerPosition }) {
  // Maipú, Chile por defecto
  const center = markerPosition || [-33.5167, -70.7617];
  useMapEvents({
    click(e) {
      onSelect([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}


export default function ReportesModal({ open, onClose, onSubmit }) {
  const [descripcion, setDescripcion] = useState("");
  const [fechaReporte, setFechaReporte] = useState(() => new Date().toISOString().slice(0,10));
  const [img, setImg] = useState("");
  const [imgPreview, setImgPreview] = useState("");
  const fileInputRef = useRef();
  const [estado, setEstado] = useState("PERDIDO");
  const [coordenadas, setCoordenadas] = useState(null);
  const [mascotaId, setMascotaId] = useState("");
  const [mascotasUsuario, setMascotasUsuario] = useState([]);
  const [usuarioId, setUsuarioId] = useState("");
  // Cargar usuarioId y mascotas asociadas (lógica robusta como en Navbar)
  const [usuario, setUsuario] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState(""); // 'success' | 'error'

  useEffect(() => {
    const cargarUsuario = () => {
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        try {
          const usuarioLS = JSON.parse(usuarioGuardado);
          // Verificar expiración del token
          if (usuarioLS.exp && Date.now() / 1000 > usuarioLS.exp) {
            // Token expirado: eliminar usuario y cerrar sesión
            localStorage.removeItem('usuario');
            setUsuario(null);
            setUsuarioId("");
            setMascotasUsuario([]);
          } else if (usuarioLS.user && usuarioLS.user.id) {
            setUsuario(usuarioLS.user);
            setUsuarioId(usuarioLS.user.id);
            // Fetch mascotas asociadas al usuario desde el backend
            fetch(`http://localhost:8080/api/usuario/${usuarioLS.user.id}/mascotas`)
              .then(res => {
                if (!res.ok) throw new Error('Error al obtener mascotas');
                return res.json();
              })
              .then(data => {
                // Si el backend retorna el usuario con campo mascotas
                const mascotas = Array.isArray(data.mascotas) ? data.mascotas : [];
                console.log('Mascotas asociadas al usuario:', mascotas);
                setMascotasUsuario(mascotas);
              })
              .catch((err) => {
                setMascotasUsuario([]);
                console.warn('Error al obtener mascotas:', err);
              });
          } else {
            setUsuario(null);
            setUsuarioId("");
            setMascotasUsuario([]);
          }
        } catch {
          setUsuario(null);
          setUsuarioId("");
          setMascotasUsuario([]);
        }
      } else {
        setUsuario(null);
        setUsuarioId("");
        setMascotasUsuario([]);
      }
    };

    cargarUsuario();
    // Escuchar cambios en localStorage (de otras pestañas)
    window.addEventListener('storage', cargarUsuario);
    // También usar un timer para detectar cambios locales y expiración
    const interval = setInterval(cargarUsuario, 1000);
    return () => {
      window.removeEventListener('storage', cargarUsuario);
      clearInterval(interval);
    };
  }, [open]);

  const [nombreMascota, setNombreMascota] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");

  if (!open) return null;
  // Si usuario es null pero existe usuario en localStorage, muestra mensaje de carga o error
  if (usuarioId && !usuario) {
    return (
      <div className="modal-reporte-overlay" onClick={onClose}>
        <div className="modal-reporte" onClick={e => e.stopPropagation()}>
          <h2>Cargando usuario...</h2>
        </div>
      </div>
    );
  }

  // Manejo de imagen: guarda la imagen en base64 y la muestra
  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        setImg(evt.target.result); // base64
        setImgPreview(evt.target.result);
        // Opcional: guardar en localStorage
        localStorage.setItem('reporte_img', evt.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImg("");
      setImgPreview("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!coordenadas) return;
    // Construir el objeto de reporte
    let reporte = {
      descripcion,
      fechaReporte,
      img, // base64
      estado,
      ubicacion: {
        latitude: coordenadas[0],
        longitude: coordenadas[1]
      }
    };
    if (usuario) {
      if (!mascotaId) return;
      reporte = {
        ...reporte,
        usuarioId: Number(usuarioId),
        mascotaId: Number(mascotaId)
      };
    } else {
      if (!nombreMascota || !nombreUsuario) return;
      reporte = {
        ...reporte,
        nombre_mascota: nombreMascota,
        nombre_usuario: nombreUsuario
      };
    }
    // Enviar el reporte al backend
    console.log('Enviando reporte:', reporte);
    fetch('http://localhost:8080/api/reportes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reporte)
    })
      .then(async res => {
        let data;
        try {
          data = await res.json();
        } catch {
          data = null;
        }
        if (!res.ok) {
          const msg = (data && data.message) ? data.message : 'Error al crear el reporte';
          throw new Error(msg);
        }
        return data;
      })
      .then(data => {
        setMensaje('¡Reporte enviado correctamente!');
        setMensajeTipo('success');
        console.log('Reporte creado correctamente:', data);
        setTimeout(() => setMensaje(""), 4000);
      })
      .catch(err => {
        setMensaje('Error al enviar el reporte: ' + err.message);
        setMensajeTipo('error');
        console.error('Error al crear el reporte:', err);
        setTimeout(() => setMensaje(""), 4000);
      });
    // Limpiar formulario solo si fue exitoso, y no cerrar el modal aún
    // El cierre del modal será manual o tras mostrar el mensaje de éxito
  };

  return (
    <div className="modal-reporte-overlay" onClick={onClose}>
      <div className="modal-reporte" onClick={e => e.stopPropagation()}>
        {mensaje && (
          <div style={{
            marginBottom: '1rem',
            padding: '10px',
            borderRadius: '6px',
            background: mensajeTipo === 'success' ? '#d4edda' : '#f8d7da',
            color: mensajeTipo === 'success' ? '#155724' : '#721c24',
            border: mensajeTipo === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {mensaje}
          </div>
        )}
        <button className="modal-reporte-close" onClick={onClose}>&times;</button>
        <form className="modal-reporte-content" onSubmit={handleSubmit}>
          <h2>Nuevo Reporte</h2>
          <div className="modal-reporte-info">
            {usuario ? (
              <>
                <label htmlFor="mascotaId">Mascota:</label>
                <select
                  id="mascotaId"
                  value={mascotaId}
                  onChange={e => setMascotaId(e.target.value)}
                  required
                  style={{marginBottom: '1rem', width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}
                >
                  <option value="">Selecciona una mascota</option>
                  {mascotasUsuario.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre} ({m.raza})</option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <label htmlFor="nombreMascota">Nombre de la mascota:</label>
                <input
                  id="nombreMascota"
                  type="text"
                  value={nombreMascota}
                  onChange={e => setNombreMascota(e.target.value)}
                  required
                  style={{marginBottom: '1rem', width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}
                />
                <label htmlFor="nombreUsuario">Tu nombre:</label>
                <input
                  id="nombreUsuario"
                  type="text"
                  value={nombreUsuario}
                  onChange={e => setNombreUsuario(e.target.value)}
                  required
                  style={{marginBottom: '1rem', width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}
                />
              </>
            )}

            <label htmlFor="descripcion">Descripción (agrega tu método de contacto):</label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              required
              rows={3}
              style={{marginBottom: '1rem', width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}
            />

            <label htmlFor="fechaReporte">Fecha del reporte:</label>
            <input
              id="fechaReporte"
              type="date"
              value={fechaReporte}
              onChange={e => setFechaReporte(e.target.value)}
              required
              style={{marginBottom: '1rem', width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}
            />

            <label htmlFor="img">Imagen:</label>
            <input
              id="img"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImgChange}
              style={{marginBottom: '1rem', width: '100%'}}
            />
            {imgPreview && (
              <div style={{marginBottom:'1rem', textAlign:'center'}}>
                <img src={imgPreview} alt="Previsualización" style={{maxWidth:'220px', maxHeight:'180px', borderRadius:'8px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}} />
              </div>
            )}

            <label htmlFor="estado">Estado:</label>
            <select
              id="estado"
              value={estado}
              onChange={e => setEstado(e.target.value)}
              required
              style={{marginBottom: '1.5rem', width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}
            >
              <option value="PERDIDO">Perdido</option>
              <option value="ENCONTRADO">Encontrado</option>
            </select>

            <label style={{display:'block', marginBottom:'0.5rem', fontWeight:'600', color:'#333'}}>Selecciona la ubicación en el mapa:</label>
            <div className="mapa-modal-registro">
              <MapContainer center={coordenadas || [-33.5167, -70.7617]} zoom={15} style={{width:'100%', height:'340px'}}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapaSelector onSelect={setCoordenadas} markerPosition={coordenadas} />
                {coordenadas && (
                  <Marker position={coordenadas} icon={pinIcon} />
                )}
              </MapContainer>
            </div>
            {coordenadas && (
              <div style={{marginTop:'0.5rem', fontSize:'0.95rem', color:'#333'}}>
                <strong>Latitud:</strong> {coordenadas[0].toFixed(6)}<br/>
                <strong>Longitud:</strong> {coordenadas[1].toFixed(6)}
              </div>
            )}
            <button className="btn-reportar" type="submit" disabled={usuario ? (!coordenadas || !mascotaId) : (!coordenadas || !nombreMascota || !nombreUsuario)}>Enviar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
