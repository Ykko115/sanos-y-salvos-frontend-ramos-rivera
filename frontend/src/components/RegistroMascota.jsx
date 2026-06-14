import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../css/RegistroMascota.css";

export default function RegistroMascota({ open, onClose }) {
  const [formData, setFormData] = useState({
    nombre: "",
    raza: "",
    edad: "",
    descripcion: "",
    especie: "PERRO",
    estado: "PERDIDO",
    nombreUsuario: "",
  });

  const [usuario, setUsuario] = useState(null);
  const [usuarioId, setUsuarioId] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState(""); // 'success' | 'error'
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});

  // Cargar usuario desde localStorage
  useEffect(() => {
    const cargarUsuario = () => {
      const usuarioGuardado = localStorage.getItem("usuario");
      if (usuarioGuardado) {
        try {
          const usuarioLS = JSON.parse(usuarioGuardado);
          // Verificar expiración del token
          if (usuarioLS.exp && Date.now() / 1000 > usuarioLS.exp) {
            localStorage.removeItem("usuario");
            setUsuario(null);
            setUsuarioId("");
          } else if (usuarioLS.user && usuarioLS.user.id) {
            setUsuario(usuarioLS.user);
            setUsuarioId(usuarioLS.user.id);
          } else {
            setUsuario(null);
            setUsuarioId("");
          }
        } catch {
          setUsuario(null);
          setUsuarioId("");
        }
      } else {
        setUsuario(null);
        setUsuarioId("");
      }
    };

    cargarUsuario();
    window.addEventListener("storage", cargarUsuario);
    const interval = setInterval(cargarUsuario, 1000);
    return () => {
      window.removeEventListener("storage", cargarUsuario);
      clearInterval(interval);
    };
  }, [open]);

  // Validar formulario
  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = "El nombre de la mascota es requerido";
    }

    if (!formData.nombreUsuario.trim()) {
      nuevosErrores.nombreUsuario = "Tu nombre es requerido";
    }

    if (!formData.raza.trim()) {
      nuevosErrores.raza = "La raza es requerida";
    }

    if (!formData.edad || formData.edad < 0) {
      nuevosErrores.edad = "La edad debe ser un número válido";
    }

    if (!formData.descripcion.trim()) {
      nuevosErrores.descripcion = "La descripción es requerida";
    }

    if (!formData.especie) {
      nuevosErrores.especie = "La especie es requerida";
    }

    if (!formData.estado) {
      nuevosErrores.estado = "El estado es requerido";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "edad" ? parseInt(value) || "" : value,
    }));
    // Limpiar errores cuando el usuario empieza a escribir
    if (errores[name]) {
      setErrores((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setCargando(true);
    setMensaje("");
    setMensajeTipo("");

    try {
      const datosEnvio = {
        nombre: formData.nombre.trim(),
        raza: formData.raza.trim(),
        edad: parseInt(formData.edad),
        descripcion: formData.descripcion.trim(),
        especie: formData.especie,
        estado: formData.estado,
        nombreUsuario: formData.nombreUsuario.trim(),
        usuarioId: usuarioId || null,
      };

      console.log("Enviando datos:", datosEnvio);

      const respuesta = await fetch("http://localhost:8080/api/mascotas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosEnvio),
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Error al registrar la mascota"
        );
      }

      const mascotaCreada = await respuesta.json();
      console.log("Mascota registrada:", mascotaCreada);

      setMensaje("¡Mascota registrada exitosamente!");
      setMensajeTipo("success");

      // Limpiar formulario
      setFormData({
        nombre: "",
        raza: "",
        edad: "",
        descripcion: "",
        especie: "PERRO",
        estado: "PERDIDO",
        nombreUsuario: "",
      });

      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      setMensaje(error.message || "Error al registrar la mascota");
      setMensajeTipo("error");
    } finally {
      setCargando(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="modal-mascota-overlay" onClick={onClose}>
      <div className="modal-mascota" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="modal-mascota-header">
          <h2>🐾 Registrar Mascota</h2>
          <p>Comparte información sobre tu mascota para ayudarnos a encontrarla</p>
        </div>

        <form onSubmit={handleSubmit} className="mascota-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombreUsuario">Tu Nombre *</label>
              <input
                type="text"
                id="nombreUsuario"
                name="nombreUsuario"
                value={formData.nombreUsuario}
                onChange={handleChange}
                placeholder="Tu nombre"
                className={errores.nombreUsuario ? "input-error" : ""}
              />
              {errores.nombreUsuario && (
                <span className="error-text">{errores.nombreUsuario}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombre">Nombre de la Mascota *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Max, Luna, Pelusa"
                className={errores.nombre ? "input-error" : ""}
              />
              {errores.nombre && (
                <span className="error-text">{errores.nombre}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="especie">Especie *</label>
              <select
                id="especie"
                name="especie"
                value={formData.especie}
                onChange={handleChange}
                className={errores.especie ? "input-error" : ""}
              >
                <option value="PERRO">🐕 Perro</option>
                <option value="GATO">🐈 Gato</option>
                <option value="HURON">🦝 Hurón</option>
                <option value="ROEDOR">🐭 Roedor</option>
                <option value="OTRO">🐾 Otro</option>
              </select>
              {errores.especie && (
                <span className="error-text">{errores.especie}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="raza">Raza *</label>
              <input
                type="text"
                id="raza"
                name="raza"
                value={formData.raza}
                onChange={handleChange}
                placeholder="Ej: Labrador, Siamés, Mixto"
                className={errores.raza ? "input-error" : ""}
              />
              {errores.raza && (
                <span className="error-text">{errores.raza}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="edad">Edad (años) *</label>
              <input
                type="number"
                id="edad"
                name="edad"
                min="0"
                max="50"
                value={formData.edad}
                onChange={handleChange}
                placeholder="Ej: 2, 5, 10"
                className={errores.edad ? "input-error" : ""}
              />
              {errores.edad && (
                <span className="error-text">{errores.edad}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="estado">Estado *</label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className={errores.estado ? "input-error" : ""}
              >
                <option value="PERDIDO">❌ Perdido</option>
                <option value="ENCONTRADO">✅ Encontrado</option>
              </select>
              {errores.estado && (
                <span className="error-text">{errores.estado}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción *</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Describe características, ubicación donde se perdió/encontró, collar, etc."
              rows="4"
              className={errores.descripcion ? "input-error" : ""}
            />
            {errores.descripcion && (
              <span className="error-text">{errores.descripcion}</span>
            )}
          </div>

          {mensaje && (
            <div className={`mensaje ${mensajeTipo}`}>
              {mensajeTipo === "success" && "✓ "}
              {mensajeTipo === "error" && "✗ "}
              {mensaje}
            </div>
          )}

          <div className="form-buttons">
            <button
              type="submit"
              className="btn-submit"
              disabled={cargando}
            >
              {cargando ? "Registrando..." : "Registrar Mascota"}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={cargando}
            >
              Cancelar
            </button>
          </div>
          </form>
      </div>
    </div>,
    document.body
  );
}
