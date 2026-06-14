import { useState } from 'react';
import { createPortal } from 'react-dom';
import '../css/EditarMascota.css';

export default function EditarMascota({ mascota, usuario, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre: mascota.nombre || '',
    raza: mascota.raza || '',
    edad: mascota.edad || '',
    descripcion: mascota.descripcion || '',
    especie: mascota.especie || 'PERRO',
    estado: mascota.estado || 'PERDIDO',
  });

  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [mensajeTipo, setMensajeTipo] = useState('');

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre de la mascota es requerido';
    }

    if (!formData.raza.trim()) {
      nuevosErrores.raza = 'La raza es requerida';
    }

    if (!formData.edad || formData.edad < 0) {
      nuevosErrores.edad = 'La edad debe ser un número válido';
    }

    if (!formData.descripcion.trim()) {
      nuevosErrores.descripcion = 'La descripción es requerida';
    }

    if (!formData.especie) {
      nuevosErrores.especie = 'La especie es requerida';
    }

    if (!formData.estado) {
      nuevosErrores.estado = 'El estado es requerido';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'edad' ? parseInt(value) || '' : value,
    }));
    if (errores[name]) {
      setErrores((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setCargando(true);
    setMensaje('');
    setMensajeTipo('');

    try {
      const datosEnvio = {
        nombre: formData.nombre.trim(),
        raza: formData.raza.trim(),
        edad: parseInt(formData.edad),
        descripcion: formData.descripcion.trim(),
        especie: formData.especie,
        estado: formData.estado,
      };

      const respuesta = await fetch(`http://localhost:8080/api/mascotas/${mascota.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario.token}`
        },
        body: JSON.stringify(datosEnvio),
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar la mascota');
      }

      setMensaje('¡Mascota actualizada exitosamente!');
      setMensajeTipo('success');

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error('Error:', error);
      setMensaje(error.message || 'Error al actualizar la mascota');
      setMensajeTipo('error');
    } finally {
      setCargando(false);
    }
  };

  return createPortal(
    <div className="modal-editar-overlay" onClick={onClose}>
      <div className="modal-editar" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="modal-editar-header">
          <h2>✏️ Editar Mascota</h2>
          <p>Actualiza la información de tu mascota</p>
        </div>

        {mensaje && (
          <div className={`mensaje mensaje-${mensajeTipo}`}>
            {mensaje}
          </div>
        )}

        <form onSubmit={handleSubmit} className="editar-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombre">Nombre de la mascota</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Max"
                className={errores.nombre ? 'input-error' : ''}
              />
              {errores.nombre && <span className="error-text">{errores.nombre}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="raza">Raza</label>
              <input
                type="text"
                id="raza"
                name="raza"
                value={formData.raza}
                onChange={handleChange}
                placeholder="Ej: Labrador"
                className={errores.raza ? 'input-error' : ''}
              />
              {errores.raza && <span className="error-text">{errores.raza}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edad">Edad</label>
              <input
                type="number"
                id="edad"
                name="edad"
                value={formData.edad}
                onChange={handleChange}
                placeholder="Ej: 3"
                min="0"
                className={errores.edad ? 'input-error' : ''}
              />
              {errores.edad && <span className="error-text">{errores.edad}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="especie">Especie</label>
              <select
                id="especie"
                name="especie"
                value={formData.especie}
                onChange={handleChange}
                className={errores.especie ? 'input-error' : ''}
              >
                <option value="PERRO">Perro</option>
                <option value="GATO">Gato</option>
                <option value="OTRO">Otro</option>
              </select>
              {errores.especie && <span className="error-text">{errores.especie}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="estado">Estado</label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className={errores.estado ? 'input-error' : ''}
            >
              <option value="PERDIDO">Perdido</option>
              <option value="ENCONTRADO">Encontrado</option>
              <option value="ADOPCION">En adopción</option>
            </select>
            {errores.estado && <span className="error-text">{errores.estado}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Describe características de tu mascota..."
              rows="4"
              className={errores.descripcion ? 'input-error' : ''}
            />
            {errores.descripcion && <span className="error-text">{errores.descripcion}</span>}
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={cargando}
              className="btn-submit"
            >
              {cargando ? '⏳ Guardando...' : '✓ Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={cargando}
              className="btn-cancel"
            >
              ✕ Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
