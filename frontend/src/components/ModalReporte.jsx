import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/ModalReporte.css";

function fmtEnum(v) {
  if (!v) return null;
  return String(v).charAt(0).toUpperCase() + String(v).slice(1).toLowerCase().replace(/_/g, ' ');
}

export default function ModalReporte({ open, onClose, mascota, encodedId }) {
  const [detalleReporte, setDetalleReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const decodeReporteId = (value) => {
    if (!value) return null;
    try {
      return atob(decodeURIComponent(value));
    } catch {
      return value;
    }
  };

  // Normalizar la respuesta del endpoint para facilitar el render
  const normalizeDetalle = (raw) => {
    if (!raw) return null;

    // Si la respuesta es la estructura completa del detalle
    const reporte = raw.reporte || raw;
    const mascotaWrapper = raw.mascota || null; // puede contener { mascota: {...}, usuario: {...} }
    const usuarioWrapper = raw.usuario || null; // puede contener { usuario: {...}, mascotas: [...] }

    let mascotaData = null;
    if (mascotaWrapper?.mascota) mascotaData = mascotaWrapper.mascota;
    else if (mascotaWrapper && (mascotaWrapper.nombre || mascotaWrapper.especie || mascotaWrapper.raza)) mascotaData = mascotaWrapper;
    else if (raw && (raw.nombre || raw.especie || raw.raza || raw.id)) mascotaData = raw;
    else if (raw.mascota) mascotaData = raw.mascota;

    const usuarioData = (usuarioWrapper && (usuarioWrapper.usuario || usuarioWrapper)) ||
              mascotaWrapper?.usuario || raw.usuario || null;

    const nombre = reporte?.nombre_mascota || mascotaData?.nombre || reporte?.nombre_usuario || '';
    const especie = mascotaData?.especie || mascotaData?.tipo || '';
    const raza = mascotaData?.raza || '';
    const color = mascotaData?.color || raw?.color || '';
    const tamano = mascotaData?.tamano || raw?.tamano || '';
    const pelaje = mascotaData?.pelaje || raw?.pelaje || '';
    const rangoEdad = mascotaData?.rangoEdad || raw?.rangoEdad || '';
    const senas = mascotaData?.senas || raw?.senas || [];
    const descripcion = reporte?.descripcion || mascotaData?.descripcion || '';
    const fecha = reporte?.fechaReporte || mascotaData?.fecha_perdida || null;
    const ubicacion = reporte?.ubicacion || mascotaData?.ubicacion || null;
    const img = reporte?.img || mascotaData?.fotoUrl || mascotaData?.img || mascotaData?.imagen || reporte?.imagen || '';

    const contacto = {};
    if (usuarioData) {
      contacto.email = usuarioData.email || usuarioData.correo || usuarioData.mail || null;
      contacto.telefono = usuarioData.telefono || usuarioData.phone || usuarioData.mobile || usuarioData.celular || null;
    }

    const telefonoReporte =
      reporte?.telefono ||
      raw?.telefono ||
      raw?.reporte?.telefono ||
      mascotaData?.telefono ||
      null;

    const emailReporte =
      reporte?.email ||
      reporte?.correo ||
      raw?.email ||
      raw?.correo ||
      raw?.reporte?.email ||
      raw?.reporte?.correo ||
      mascotaData?.email ||
      mascotaData?.correo ||
      null;

    if (!contacto.telefono && telefonoReporte) contacto.telefono = telefonoReporte;
    if (!contacto.email && emailReporte) contacto.email = emailReporte;

    const usuarioNombre = usuarioData ? `${usuarioData.nombre || ''}${usuarioData.apellido ? ' ' + usuarioData.apellido : ''}`.trim() : (reporte?.nombre_usuario || null);

    return {
      nombre,
      especie,
      raza,
      color,
      tamano,
      pelaje,
      rangoEdad,
      senas,
      descripcion,
      fecha_perdida: fecha,
      ubicacion,
      img,
      contacto: (contacto.email || contacto.telefono) ? contacto : null,
      usuarioNombre,
      _raw: raw,
    };
  };

  // Obtener detalles del reporte cuando se abre el modal
  useEffect(() => {
    if (open && (mascota || encodedId)) {
      // Buscar campos comunes que puedan contener el id del reporte
      const getReporteId = (m) => {
        return (
          m?.id || // muchos listados usan `id` como id del reporte
          m?.reporteId || m?.reporte_id || m?.reportId || m?.report_id || m?.idReporte || m?.id_reporte ||
          m?.reporte?.id || m?.reporte?.reportId || m?.mascotaId || null
        );
      };

      const reporteId = getReporteId(mascota) || decodeReporteId(encodedId);
      const controller = new AbortController();
      const { signal } = controller;
      let tStart;

      if (reporteId) {
        tStart = setTimeout(() => {
          if (!signal.aborted) setCargando(true);
        }, 0);
        fetch(`http://localhost:8080/api/reportes/detalle/${reporteId}`, { signal })
          .then(res => {
            if (!res.ok) throw new Error('Error al obtener detalles del reporte');
            return res.json();
          })
          .then(data => {
            if (!signal.aborted) setDetalleReporte(normalizeDetalle(data));
          })
          .catch(error => {
            if (signal.aborted) return;
            console.error('Error al obtener detalle del reporte:', error);
            if (!signal.aborted && mascota) setDetalleReporte(normalizeDetalle(mascota));
          })
          .finally(() => {
            if (!signal.aborted) setCargando(false);
          });
      } else {
        // No se encontró id de reporte explícito: usar mascota como fallback
        console.warn('No se encontró id de reporte en el objeto. Usando mascota como fallback.');
        const t = setTimeout(() => {
          setDetalleReporte(normalizeDetalle(mascota));
          setCargando(false);
        }, 0);
        // limpiar timeout si el efecto se desmonta
        return () => clearTimeout(t);
      }

      return () => {
        controller.abort();
        if (tStart) clearTimeout(tStart);
      };
    } else {
      const t2 = setTimeout(() => setCargando(false), 0);
      return () => clearTimeout(t2);
    }
  }, [open, mascota, encodedId]);

  // Limpiar detalle cuando se cierre el modal para evitar datos viejos
  useEffect(() => {
    let t;
    if (!open) t = setTimeout(() => setDetalleReporte(null), 0);
    return () => { if (t) clearTimeout(t); };
  }, [open]);

  if (!open || (!mascota && !encodedId)) return null;

  const datos = detalleReporte || normalizeDetalle(mascota) || {};

  const modalContent = (
    <div className="modal-reporte-overlay" onClick={onClose}>
      <div className="modal-reporte" onClick={e => e.stopPropagation()}>
        <button className="modal-reporte-close" onClick={onClose}>&times;</button>
        {cargando ? (
          <div className="modal-reporte-content modal-reporte-content-loading">
            <p>Cargando datos...</p>
          </div>
        ) : (
          <div className="modal-reporte-content">
            {(datos.img || datos.foto || datos.imagen) && (
              <img
                src={datos.img || datos.foto || datos.imagen}
                alt={datos.nombre}
                className="modal-reporte-foto"
                onError={e => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="modal-reporte-info">
              <h2>{datos.nombre}</h2>
              <p className="especie-raza">
                {fmtEnum(datos.especie || datos.tipo)}
                {datos.raza ? ` · ${fmtEnum(datos.raza)}` : ''}
              </p>

              <div className="modal-atributos">
                {datos.color    && <span className="modal-atributo-chip">🎨 {fmtEnum(datos.color)}</span>}
                {datos.tamano   && <span className="modal-atributo-chip">📏 {fmtEnum(datos.tamano)}</span>}
                {datos.pelaje   && <span className="modal-atributo-chip">🐾 Pelaje {fmtEnum(datos.pelaje)}</span>}
                {datos.rangoEdad && <span className="modal-atributo-chip">🗓️ {fmtEnum(datos.rangoEdad)}</span>}
              </div>

              {Array.isArray(datos.senas) && datos.senas.length > 0 && (
                <p className="color"><strong>Señas particulares:</strong> {datos.senas.map(s => fmtEnum(s)).join(', ')}</p>
              )}

              {datos.descripcion && (
                <p className="descripcion"><strong>Descripción:</strong> {datos.descripcion}</p>
              )}

              {datos.fecha_perdida && (
                <p className="fecha"><strong>Fecha del reporte:</strong> {new Date(datos.fecha_perdida).toLocaleDateString('es-CL')}</p>
              )}

              {datos.usuarioNombre && (
                <p className="reportado-por"><strong>Reportado por:</strong> {datos.usuarioNombre}</p>
              )}

              {(() => {
                const fc = datos.contacto || {};
                const telefono = fc.telefono || fc.phone || fc.celular || null;
                const email = fc.email || fc.correo || fc.mail || null;
                if (!telefono && !email) return null;
                return (
                  <div className="contacto">
                    <p><strong>Contacto:</strong></p>
                    {telefono && <p>📱 <a href={`tel:${telefono}`}>{telefono}</a></p>}
                    {email    && <p>📧 <a href={`mailto:${email}`}>{email}</a></p>}
                  </div>
                );
              })()}

              <button
                className="btn-reportar"
                onClick={() => {
                  onClose();
                  const bgLoc = location.state?.backgroundLocation || { pathname: '/', search: '', hash: '' };
                  navigate('/nuevo-reporte', {
                    state: { backgroundLocation: bgLoc, flujoInicial: 'encontrada' },
                  });
                }}
              >
                He visto esta mascota
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
