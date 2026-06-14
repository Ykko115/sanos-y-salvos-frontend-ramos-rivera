import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { COLORES, TAMANOS, PELAJES, RANGOS_EDAD, SENAS } from "../constants/enums";
import "../css/RegistroMascota.css";

function ColorCirculo({ clave, activo, onClick }) {
  const { label, hex } = COLORES[clave];
  return (
    <button
      type="button"
      title={label}
      className={`rm-color-btn ${activo ? "activo" : ""}`}
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

const INIT = {
  nombre: "", especie: "PERRO", raza: "", edad: "",
  color: "", tamano: "", pelaje: "", rangoEdad: "", senas: [],
  descripcion: "", fotoUrl: "", estado: "PERDIDO",
};

export default function RegistroMascota({ open, onClose }) {
  const [form, setForm] = useState(INIT);
  const [usuarioId, setUsuarioId] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});
  const [preview, setPreview] = useState("");
  const fileRef = useRef();

  useEffect(() => {
    const cargar = () => {
      const raw = localStorage.getItem("usuario");
      if (!raw) { setUsuarioId(null); return; }
      try {
        const u = JSON.parse(raw);
        if (u.exp && Date.now() / 1000 > u.exp) {
          localStorage.removeItem("usuario");
          setUsuarioId(null);
        } else if (u.user?.id) {
          setUsuarioId(u.user.id);
        }
      } catch { setUsuarioId(null); }
    };
    cargar();
    window.addEventListener("storage", cargar);
    const t = setInterval(cargar, 1000);
    return () => { window.removeEventListener("storage", cargar); clearInterval(t); };
  }, [open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleSena = (s) =>
    setForm(f => ({
      ...f,
      senas: f.senas.includes(s) ? f.senas.filter(x => x !== s) : [...f.senas, s],
    }));

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) { setPreview(""); set("fotoUrl", ""); return; }
    const reader = new FileReader();
    reader.onload = ev => { setPreview(ev.target.result); set("fotoUrl", ev.target.result); };
    reader.readAsDataURL(file);
  };

  const validar = () => {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = "El nombre es obligatorio.";
    if (!form.especie) errs.especie = "La especie es obligatoria.";
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setCargando(true);
    setMensaje(""); setMensajeTipo("");
    try {
      const payload = {
        nombre: form.nombre.trim(),
        especie: form.especie,
        raza: form.raza || null,
        edad: form.edad ? Number(form.edad) : null,
        descripcion: form.descripcion || null,
        color: form.color || null,
        tamano: form.tamano || null,
        pelaje: form.pelaje || null,
        rangoEdad: form.rangoEdad || null,
        senas: form.senas.length ? form.senas : null,
        fotoUrl: form.fotoUrl || null,
        estado: form.estado,
        usuarioId: usuarioId,
      };
      const res = await fetch("/api/mascotas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al registrar la mascota.");
      setMensaje("Mascota registrada exitosamente!");
      setMensajeTipo("success");
      setForm(INIT);
      setPreview("");
      setTimeout(onClose, 2000);
    } catch (err) {
      setMensaje(err.message);
      setMensajeTipo("error");
    } finally {
      setCargando(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="modal-mascota-overlay" onClick={onClose}>
      <div className="modal-mascota" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>x</button>

        <div className="modal-mascota-header">
          <h2>Registrar Mascota</h2>
          <p>Agrega los datos de tu mascota para tenerla en el sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="mascota-form">

          {/* Nombre + Especie */}
          <div className="form-row">
            <div className="form-group">
              <label>Nombre *</label>
              <input
                value={form.nombre}
                onChange={e => set("nombre", e.target.value)}
                placeholder="Ej: Toby"
                className={errores.nombre ? "input-error" : ""}
              />
              {errores.nombre && <span className="error-text">{errores.nombre}</span>}
            </div>
            <div className="form-group">
              <label>Especie *</label>
              <select
                value={form.especie}
                onChange={e => set("especie", e.target.value)}
                className={errores.especie ? "input-error" : ""}
              >
                <option value="">Selecciona...</option>
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
              <input
                value={form.raza}
                onChange={e => set("raza", e.target.value)}
                placeholder="Ej: Labrador, Siames..."
              />
            </div>
            <div className="form-group">
              <label>Edad (años)</label>
              <input
                type="number" min="0" max="30"
                value={form.edad}
                onChange={e => set("edad", e.target.value)}
                placeholder="Ej: 3"
              />
            </div>
          </div>

          {/* Color */}
          <div className="form-group">
            <label>Color</label>
            <div className="rm-paleta">
              {Object.keys(COLORES).map(k => (
                <ColorCirculo
                  key={k} clave={k} activo={form.color === k}
                  onClick={v => set("color", form.color === v ? "" : v)}
                />
              ))}
            </div>
            {form.color && (
              <span className="rm-seleccion">Color: {COLORES[form.color].label}</span>
            )}
          </div>

          {/* Tamano */}
          <div className="form-group">
            <label>Tamano</label>
            <div className="rm-btn-group">
              {Object.entries(TAMANOS).map(([k, v]) => (
                <button key={k} type="button"
                  className={`rm-btn-sel ${form.tamano === k ? "activo" : ""}`}
                  onClick={() => set("tamano", form.tamano === k ? "" : k)}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Pelaje */}
          <div className="form-group">
            <label>Pelaje</label>
            <div className="rm-btn-group">
              {Object.entries(PELAJES).map(([k, v]) => (
                <button key={k} type="button"
                  className={`rm-btn-sel ${form.pelaje === k ? "activo" : ""}`}
                  onClick={() => set("pelaje", form.pelaje === k ? "" : k)}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Rango de edad */}
          <div className="form-group">
            <label>Rango de edad</label>
            <div className="rm-btn-group">
              {Object.entries(RANGOS_EDAD).filter(([k]) => k !== "NO_SE").map(([k, v]) => (
                <button key={k} type="button"
                  className={`rm-btn-sel ${form.rangoEdad === k ? "activo" : ""}`}
                  onClick={() => set("rangoEdad", form.rangoEdad === k ? "" : k)}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Caracteristicas particulares */}
          <div className="form-group">
            <label>Caracteristicas particulares</label>
            <div className="rm-senas-grid">
              {Object.entries(SENAS).filter(([k]) => k !== "MUY_SOCIABLE").map(([k, v]) => (
                <label key={k} className="rm-sena-item">
                  <input
                    type="checkbox"
                    checked={form.senas.includes(k)}
                    onChange={() => toggleSena(k)}
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>

          {/* Descripcion */}
          <div className="form-group">
            <label>Descripcion</label>
            <textarea
              value={form.descripcion}
              onChange={e => set("descripcion", e.target.value)}
              placeholder="Caracteristicas adicionales, collar, microchip..."
              rows="3"
            />
          </div>

          {/* Foto */}
          <div className="form-group">
            <label>Foto de la mascota</label>
            <input
              type="file" accept="image/*"
              ref={fileRef} onChange={handleFoto}
            />
            {preview && (
              <img src={preview} alt="preview" className="rm-foto-preview" />
            )}
          </div>

          {/* Estado */}
          <div className="form-group">
            <label>Estado</label>
            <select value={form.estado} onChange={e => set("estado", e.target.value)}>
              <option value="PERDIDO">Perdido</option>
              <option value="ENCONTRADO">Encontrado</option>
              <option value="REUNIDO">Reunido</option>
            </select>
          </div>

          {mensaje && (
            <div className={`mensaje ${mensajeTipo}`}>{mensaje}</div>
          )}

          <div className="form-buttons">
            <button type="submit" className="btn-submit" disabled={cargando}>
              {cargando ? "Registrando..." : "Registrar Mascota"}
            </button>
            <button type="button" className="btn-cancel" onClick={onClose} disabled={cargando}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
