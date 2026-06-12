import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { COLORES, TAMANOS, PELAJES, RANGOS_EDAD, SENAS } from "../constants/enums";
import "../css/EditarMascota.css";

function ColorCirculo({ clave, activo, onClick }) {
  const { label, hex } = COLORES[clave];
  return (
    <button
      type="button"
      title={label}
      className={`ed-color-btn ${activo ? "activo" : ""}`}
      style={{
        background: hex || "#e5e7eb",
        border: hex === "#f5f5f0" ? "1px solid #d1d5db" : undefined,
      }}
      onClick={() => onClick(clave)}
    >
      {!hex && "?"}
    </button>
  );
}

export default function EditarMascota({ mascota, usuario, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre:    mascota.nombre    || "",
    raza:      mascota.raza      || "",
    edad:      mascota.edad      || "",
    descripcion: mascota.descripcion || "",
    especie:   mascota.especie   || "PERRO",
    estado:    mascota.estado    || "PERDIDO",
    color:     mascota.color     || "",
    tamano:    mascota.tamano    || "",
    pelaje:    mascota.pelaje    || "",
    rangoEdad: mascota.rangoEdad || "",
    senas:     Array.isArray(mascota.senas) ? mascota.senas : [],
    fotoUrl:   mascota.fotoUrl || "",
  });

  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState("");
  const [preview, setPreview] = useState(mascota.fotoUrl || "");
  const fileRef = useRef();

  const set = (k, v) => setFormData(f => ({ ...f, [k]: v }));

  const toggleSena = (s) =>
    setFormData(f => ({
      ...f,
      senas: f.senas.includes(s) ? f.senas.filter(x => x !== s) : [...f.senas, s],
    }));

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setPreview(ev.target.result);
      set("fotoUrl", ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "edad" ? parseInt(value) || "" : value,
    }));
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: "" }));
  };

  const validar = () => {
    const errs = {};
    if (!formData.nombre.trim()) errs.nombre = "El nombre es requerido";
    if (!formData.especie) errs.especie = "La especie es requerida";
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setCargando(true);
    setMensaje(""); setMensajeTipo("");
    try {
      const datosEnvio = {
        nombre:      formData.nombre.trim(),
        raza:        formData.raza.trim() || null,
        edad:        formData.edad ? parseInt(formData.edad) : null,
        descripcion: formData.descripcion.trim() || null,
        especie:     formData.especie,
        estado:      formData.estado,
        color:       formData.color || null,
        tamano:      formData.tamano || null,
        pelaje:      formData.pelaje || null,
        rangoEdad:   formData.rangoEdad || null,
        senas:       formData.senas.length ? formData.senas : null,
        fotoUrl:     formData.fotoUrl || null,
        usuarioId:   mascota.usuarioId || null,
      };
      const respuesta = await fetch(`/api/mascotas/${mascota.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosEnvio),
      });
      if (!respuesta.ok) {
        const err = await respuesta.json().catch(() => ({}));
        throw new Error(err.message || err.error || "Error al actualizar la mascota");
      }
      setMensaje("Mascota actualizada exitosamente!");
      setMensajeTipo("success");
      setTimeout(() => onSuccess(), 1500);
    } catch (error) {
      setMensaje(error.message || "Error al actualizar la mascota");
      setMensajeTipo("error");
    } finally {
      setCargando(false);
    }
  };

  return createPortal(
    <div className="modal-editar-overlay" onClick={onClose}>
      <div className="modal-editar" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>x</button>

        <div className="modal-editar-header">
          <h2>Editar Mascota</h2>
          <p>Actualiza la informacion de {mascota.nombre}</p>
        </div>

        {mensaje && (
          <div className={`mensaje mensaje-${mensajeTipo}`}>{mensaje}</div>
        )}

        <form onSubmit={handleSubmit} className="editar-form">

          {/* Nombre + Especie */}
          <div className="form-row">
            <div className="form-group">
              <label>Nombre *</label>
              <input name="nombre" value={formData.nombre} onChange={handleChange}
                placeholder="Ej: Max" className={errores.nombre ? "input-error" : ""} />
              {errores.nombre && <span className="error-text">{errores.nombre}</span>}
            </div>
            <div className="form-group">
              <label>Especie *</label>
              <select name="especie" value={formData.especie} onChange={handleChange}
                className={errores.especie ? "input-error" : ""}>
                <option value="PERRO">Perro</option>
                <option value="GATO">Gato</option>
                <option value="HURON">Huron</option>
                <option value="ROEDOR">Roedor</option>
                <option value="OTRO">Otro</option>
              </select>
              {errores.especie && <span className="error-text">{errores.especie}</span>}
            </div>
          </div>

          {/* Raza + Edad */}
          <div className="form-row">
            <div className="form-group">
              <label>Raza</label>
              <input name="raza" value={formData.raza} onChange={handleChange} placeholder="Ej: Labrador" />
            </div>
            <div className="form-group">
              <label>Edad (anos)</label>
              <input name="edad" type="number" min="0" max="30"
                value={formData.edad} onChange={handleChange} placeholder="Ej: 3" />
            </div>
          </div>

          {/* Color */}
          <div className="form-group">
            <label>Color</label>
            <div className="ed-paleta">
              {Object.keys(COLORES).map(k => (
                <ColorCirculo key={k} clave={k} activo={formData.color === k}
                  onClick={v => set("color", formData.color === v ? "" : v)} />
              ))}
            </div>
            {formData.color && (
              <span className="ed-seleccion">Color: {COLORES[formData.color].label}</span>
            )}
          </div>

          {/* Tamano */}
          <div className="form-group">
            <label>Tamano</label>
            <div className="ed-btn-group">
              {Object.entries(TAMANOS).map(([k, v]) => (
                <button key={k} type="button"
                  className={`ed-btn-sel ${formData.tamano === k ? "activo" : ""}`}
                  onClick={() => set("tamano", formData.tamano === k ? "" : k)}>{v}</button>
              ))}
            </div>
          </div>

          {/* Pelaje */}
          <div className="form-group">
            <label>Pelaje</label>
            <div className="ed-btn-group">
              {Object.entries(PELAJES).map(([k, v]) => (
                <button key={k} type="button"
                  className={`ed-btn-sel ${formData.pelaje === k ? "activo" : ""}`}
                  onClick={() => set("pelaje", formData.pelaje === k ? "" : k)}>{v}</button>
              ))}
            </div>
          </div>

          {/* Rango de edad */}
          <div className="form-group">
            <label>Rango de edad</label>
            <div className="ed-btn-group">
              {Object.entries(RANGOS_EDAD).filter(([k]) => k !== "NO_SE").map(([k, v]) => (
                <button key={k} type="button"
                  className={`ed-btn-sel ${formData.rangoEdad === k ? "activo" : ""}`}
                  onClick={() => set("rangoEdad", formData.rangoEdad === k ? "" : k)}>{v}</button>
              ))}
            </div>
          </div>

          {/* Caracteristicas particulares */}
          <div className="form-group">
            <label>Caracteristicas particulares</label>
            <div className="ed-senas-grid">
              {Object.entries(SENAS).filter(([k]) => k !== "MUY_SOCIABLE").map(([k, v]) => (
                <label key={k} className="ed-sena-item">
                  <input type="checkbox" checked={formData.senas.includes(k)} onChange={() => toggleSena(k)} />
                  {v}
                </label>
              ))}
            </div>
          </div>

          {/* Foto */}
          <div className="form-group">
            <label>Foto de la mascota</label>
            {preview && (
              <img src={preview} alt="foto actual" className="ed-foto-preview" />
            )}
            <input
              type="file" accept="image/*"
              ref={fileRef} onChange={handleFoto}
              style={{ marginTop: preview ? "0.5rem" : 0 }}
            />
            {preview && (
              <button
                type="button"
                className="ed-btn-quitar-foto"
                onClick={() => { setPreview(""); set("fotoUrl", ""); if (fileRef.current) fileRef.current.value = ""; }}
              >
                Quitar foto
              </button>
            )}
          </div>

          {/* Descripcion */}
          <div className="form-group">
            <label>Descripcion</label>
            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange}
              placeholder="Caracteristicas adicionales..." rows="3" />
          </div>

          {/* Estado */}
          <div className="form-group">
            <label>Estado</label>
            <select name="estado" value={formData.estado} onChange={handleChange}>
              <option value="PERDIDO">Perdido</option>
              <option value="ENCONTRADO">Encontrado</option>
              <option value="REUNIDO">Reunido</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={cargando} className="btn-submit">
              {cargando ? "Guardando..." : "Guardar Cambios"}
            </button>
            <button type="button" onClick={onClose} disabled={cargando} className="btn-cancel">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
