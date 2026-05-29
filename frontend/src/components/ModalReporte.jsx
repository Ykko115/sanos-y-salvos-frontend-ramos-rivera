import "../css/ModalReporte.css";

export default function ModalReporte({ open, onClose, mascota }) {
  if (!open || !mascota) return null;
  return (
    <div className="modal-reporte-overlay" onClick={onClose}>
      <div className="modal-reporte" onClick={e => e.stopPropagation()}>
        <button className="modal-reporte-close" onClick={onClose}>&times;</button>
        <div className="modal-reporte-content">
          <img src={mascota.img || mascota.foto || mascota.imagen || ''} alt={mascota.nombre} className="modal-reporte-foto" />
          <div className="modal-reporte-info">
            <h2>{mascota.nombre}</h2>
            <p className="especie-raza">{mascota.especie} - {mascota.raza}</p>
            <p className="color"><strong>Color:</strong> {mascota.color}</p>
            <p className="descripcion"><strong>Descripción:</strong> {mascota.descripcion}</p>
            <p className="fecha"><strong>Fecha de pérdida:</strong> {mascota.fecha_perdida}</p>
            <p className="ubicacion"><strong>Última ubicación:</strong> {mascota.ubicacion.nombre}</p>
            <div className="contacto">
              <p><strong>Contacto:</strong></p>
              <p>📱 {mascota.contacto?.telefono || 'No disponible'}</p>
              <p>📧 {mascota.contacto?.email || 'No disponible'}</p>
            </div>
            <button className="btn-reportar">He visto esta mascota</button>
          </div>
        </div>
      </div>
    </div>
  );
}
