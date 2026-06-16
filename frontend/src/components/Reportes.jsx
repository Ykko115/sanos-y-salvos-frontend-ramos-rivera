import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import "../css/ModalReporte.css";
import { validarTelefono } from "../js/validaciones";


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
  // eslint-disable-next-line no-unused-vars
  const center = markerPosition || [-33.5167, -70.7617];
  useMapEvents({
    click(e) {
      onSelect([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}


export default function ReportesModal({ open, onClose }) {
  const [descripcion, setDescripcion] = useState("");
  const [fechaReporte, setFechaReporte] = useState(() => new Date().toISOString().slice(0,10));
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState("");
  const [imgUrl, setImgUrl] = useState(""); // <-- NUEVO estado para la URL pública
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
  const [telefono, setTelefono] = useState("");

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
            if (usuarioLS.user.telefono) {
              setTelefono(String(usuarioLS.user.telefono));
            }
            // Fetch mascotas asociadas al usuario desde el backend
            fetch(`/api/usuario/${usuarioLS.user.id}/mascotas`)
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

  // Manejo de imagen: guarda el archivo y la previsualización
  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImgFile(file);
      const reader = new FileReader();
      reader.onload = function(evt) {
        setImgPreview(evt.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImgFile(null);
      setImgPreview("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coordenadas) return;

    if (!usuario) {
      if (!telefono) {
        setMensaje('El teléfono es requerido');
        setMensajeTipo('error');
        setTimeout(() => setMensaje(""), 4000);
        return;
      }

      if (!validarTelefono(telefono)) {
        setMensaje('Ingresa un teléfono válido');
        setMensajeTipo('error');
        setTimeout(() => setMensaje(""), 4000);
        return;
      }
    }

    let imageUrl = "";
    // Subir imagen si existe
    if (imgFile) {
      const formData = new FormData();
      formData.append('file', imgFile);
      try {
        const res = await fetch('/api/reportes/upload-image', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.message || 'Error al subir imagen');
        imageUrl = data.url;
        setImgUrl(data.url); // <-- Guarda la URL pública
      } catch (err) {
        setMensaje('Error al subir la imagen: ' + err.message);
        setMensajeTipo('error');
        setTimeout(() => setMensaje(""), 4000);
        setImgUrl(""); // Limpia la URL si hay error
        return;
      }
    }
    // Construir el objeto de reporte
    let reporte = {
      descripcion,
      fechaReporte,
      img: imageUrl, // URL de Cloudflare
      estado,
      ubicacion: {
        latitude: coordenadas[0],
        longitude: coordenadas[1]
      }
    };
    if (telefono) {
      reporte = {
        ...reporte,
        telefono,
      };
    }
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
    try {
      const res = await fetch('/api/reportes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reporte)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data && data.message ? data.message : 'Error al crear el reporte');
      alert('¡Reporte enviado correctamente!');
      onClose();
    } catch (err) {
      setMensaje('Error al enviar el reporte: ' + err.message);
      setMensajeTipo('error');
      setTimeout(() => setMensaje(""), 4000);
    }
    // Limpiar formulario solo si fue exitoso, y no cerrar el modal aún
    // El cierre del modal será manual o tras mostrar el mensaje de éxito
  };

  return (
    <div className="modal-reporte-overlay" onClick={onClose}>
      <div className="modal-reporte" onClick={e => e.stopPropagation()}>
        {mensaje && (
          <div className={`modal-reporte-mensaje ${mensajeTipo}`}>{mensaje}</div>
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
                  className="modal-reporte-input"
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
                  className="modal-reporte-input"
                />
                <label htmlFor="nombreUsuario">Tu nombre:</label>
                <input
                  id="nombreUsuario"
                  type="text"
                  value={nombreUsuario}
                  onChange={e => setNombreUsuario(e.target.value)}
                  required
                  className="modal-reporte-input"
                />
              </>
            )}

            {!usuario ? (
              <>
                <label htmlFor="telefono">Teléfono</label>
                <div className="modal-reporte-phone-wrapper">
                  <span className="modal-reporte-phone-prefix">+56</span>
                  <input
                    id="telefono"
                    type="tel"
                    value={(() => {
                      let raw = telefono.replace(/[^\d]/g, '');
                      if (!raw) return '';
                      let out = raw[0] || '';
                      if (raw.length > 1) out += ' ' + raw.slice(1, 5);
                      if (raw.length > 5) out += ' ' + raw.slice(5, 9);
                      if (raw.length > 9) out += ' ' + raw.slice(9, 13);
                      return out;
                    })()}
                    onChange={e => {
                      let value = e.target.value.replace(/[^\d]/g, '');
                      setTelefono(value);
                    }}
                    placeholder="9 1234 5678"
                    className="modal-reporte-input"
                    maxLength={12}
                    required
                  />
                </div>
              </>
            ) : telefono ? (
              <div className="modal-reporte-telefono-registrado">
                <strong>Teléfono registrado:</strong> +56 {telefono}
              </div>
            ) : null}

            <label htmlFor="descripcion">Descripción (agrega tu método de contacto):</label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              required
              rows={3}
              className="modal-reporte-input"
            />

            <label htmlFor="fechaReporte">Fecha del reporte:</label>
            <input
              id="fechaReporte"
              type="date"
              value={fechaReporte}
              onChange={e => setFechaReporte(e.target.value)}
              required
              className="modal-reporte-input"
            />

            <label htmlFor="img">Imagen:</label>
            <input
              id="img"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImgChange}
              className="modal-reporte-input-file"
            />
            {imgPreview && (
              <div className="modal-reporte-img-preview">
                <img src={imgPreview} alt="Previsualización" />
              </div>
            )}
            {imgUrl && (
              <div className="modal-reporte-img-publica">
                <p>Imagen subida correctamente:</p>
                <a href={imgUrl} target="_blank" rel="noopener noreferrer">{imgUrl}</a>
                <img src={imgUrl} alt="Imagen subida" style={{maxWidth: 200, marginTop: 8}} />
              </div>
            )}

            <label htmlFor="estado">Estado:</label>
            <select
              id="estado"
              value={estado}
              onChange={e => setEstado(e.target.value)}
              required
              className="modal-reporte-input modal-reporte-input-estado"
            >
              <option value="PERDIDO">Perdido</option>
              <option value="ENCONTRADO">Encontrado</option>
            </select>

            <label className="modal-reporte-label-mapa">Selecciona la ubicación en el mapa:</label>
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
              <div className="modal-reporte-coords">
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
