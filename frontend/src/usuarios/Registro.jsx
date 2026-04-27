import { useState } from 'react';
import { validarFormularioRegistro } from '../js/validaciones';
import { crearManejadorCambio, crearManejadorEnvioRegistro } from '../js/manejadoresFormulario';
import './css/Registro.css';

export default function Registro({ onClose, onSwitchToLogin }) {
  const [datosFormulario, establecerDatosFormulario] = useState({
    rut: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
  });

  const [errores, establecerErrores] = useState({});
  const [cargando, establecerCargando] = useState(false);

  const manejadorCambio = crearManejadorCambio(establecerDatosFormulario, establecerErrores);
  const manejadorEnvio = crearManejadorEnvioRegistro(
    datosFormulario,
    establecerErrores,
    establecerCargando,
    validarFormularioRegistro,
    onClose
  );

  return (
    <div className="registro-overlay">
      <div className="registro-container">
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="registro-header">
          <h2>🐾 Crear Cuenta</h2>
          <p>Únete a nuestra comunidad de amantes de mascotas</p>
        </div>

        <form onSubmit={manejadorEnvio} className="registro-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="rut">RUT</label>
              <input
                type="text"
                id="rut"
                name="rut"
                value={datosFormulario.rut}
                onChange={manejadorCambio}
                placeholder="12.345.678-9"
                className={errores.rut ? 'input-error' : ''}
              />
              {errores.rut && (
                <span className="error-message">{errores.rut}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombre">Nombre</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={datosFormulario.nombre}
                onChange={manejadorCambio}
                placeholder="Tu nombre"
                className={errores.nombre ? 'input-error' : ''}
              />
              {errores.nombre && (
                <span className="error-message">{errores.nombre}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="apellido">Apellido</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={datosFormulario.apellido}
                onChange={manejadorCambio}
                placeholder="Tu apellido"
                className={errores.apellido ? 'input-error' : ''}
              />
              {errores.apellido && (
                <span className="error-message">{errores.apellido}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={datosFormulario.email}
              onChange={manejadorCambio}
              placeholder="tu@correo.com"
              className={errores.email ? 'input-error' : ''}
            />
            {errores.email && (
              <span className="error-message">{errores.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Teléfono</label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={datosFormulario.telefono}
              onChange={manejadorCambio}
              placeholder="+56 9 1234 5678"
              className={errores.telefono ? 'input-error' : ''}
            />
            {errores.telefono && (
              <span className="error-message">{errores.telefono}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={datosFormulario.password}
                onChange={manejadorCambio}
                placeholder="••••••••"
                className={errores.password ? 'input-error' : ''}
              />
              {errores.password && (
                <span className="error-message">{errores.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={datosFormulario.confirmPassword}
                onChange={manejadorCambio}
                placeholder="••••••••"
                className={errores.confirmPassword ? 'input-error' : ''}
              />
              {errores.confirmPassword && (
                <span className="error-message">{errores.confirmPassword}</span>
              )}
            </div>
          </div>

          {errores.submit && (
            <div className="error-message-submit">{errores.submit}</div>
          )}

          <button
            type="submit"
            className="btn-submit"
            disabled={cargando}
          >
            {cargando ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="registro-footer">
          <p>
            ¿Ya tienes cuenta?{' '}
            <button
              className="switch-button"
              onClick={onSwitchToLogin}
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
