import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "../css/ModalReporte.css";

export default function ModalReporte({ open, onClose, mascota, encodedId }) {
  const [detalleReporte, setDetalleReporte] = useState(null);
  const [cargando, setCargando] = useState(false);

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

    const nombre = reporte?.nombre_mascota || mascotaData?.nombre || mascotaData?.nombre || reporte?.nombre_usuario || '';
    const especie = mascotaData?.especie || mascotaData?.tipo || '';
    const raza = mascotaData?.raza || '';
    const descripcion = reporte?.descripcion || mascotaData?.descripcion || '';
    const fecha = reporte?.fechaReporte || mascotaData?.fecha_perdida || null;
    const ubicacion = reporte?.ubicacion || mascotaData?.ubicacion || null;
    const img = reporte?.img || mascotaData?.img || mascotaData?.imagen || reporte?.imagen || '';

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
      descripcion,
      fecha_perdida: fecha,
      ubicacion,
      img,
      contacto: (contacto.email || contacto.telefono) ? contacto : null,
      usuarioNombre,
      // incluir la estructura original por si hace falta
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
        fetch(`/api/reportes/detalle/${reporteId}`, { signal })
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
            <img src={datos.img || datos.foto || datos.imagen || ''} alt={datos.nombre} className="modal-reporte-foto" />
            <div className="modal-reporte-info">
              <h2>{datos.nombre}</h2>
              <p className="especie-raza">
                {datos.especie || datos.tipo} {datos.raza ? `- ${datos.raza}` : ''}
              </p>
              {datos.color && <p className="color"><strong>Color:</strong> {datos.color}</p>}
              {datos.descripcion && <p className="descripcion"><strong>Descripción:</strong> {datos.descripcion}</p>}
              {datos.fecha_perdida && <p className="fecha"><strong>Fecha de pérdida:</strong> {datos.fecha_perdida}</p>}
              {/* Última ubicación oculta por solicitud del usuario */}
              {datos.usuarioNombre && (
                <p className="reportado-por"><strong>Reportado por:</strong> {datos.usuarioNombre}</p>
              )}
              {
                // Intentar obtener contacto desde varias posibles propiedades
              }
              {(() => {
                const fuenteContacto = datos.contacto || datos.usuario || datos.usuer || datos.reporter || datos.owner || datos.creador || {};
                const telefono = fuenteContacto.telefono || fuenteContacto.phone || fuenteContacto.mobile || fuenteContacto.celular || fuenteContacto.cel || null;
                const email = fuenteContacto.email || fuenteContacto.correo || fuenteContacto.correo_electronico || fuenteContacto.mail || null;

                if (!telefono && !email) return null;

                return (
                  <div className="contacto">
                    <p><strong>Contacto:</strong></p>
                    <p>📱 {telefono ? <a href={`tel:${telefono}`}>{telefono}</a> : 'No disponible'}</p>
                    <p>📧 {email ? <a href={`mailto:${email}`}>{email}</a> : 'No disponible'}</p>
                  </div>
                );
              })()}
              <button className="btn-reportar">He visto esta mascota</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
