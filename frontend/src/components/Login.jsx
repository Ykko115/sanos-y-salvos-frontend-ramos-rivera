
import { useNavigate, useLocation } from 'react-router-dom';
import { validarFormularioLogin } from '../js/validaciones';
import { crearManejadorCambio, crearManejadorEnvioLogin } from '../js/manejadoresFormulario';
import { useState } from 'react';
import '../css/Registro.css';


export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const bgLocation = location.state?.backgroundLocation || { pathname: '/' };
  const [datosFormulario, establecerDatosFormulario] = useState({
    email: '',
    password: '',
  });

  const [errores, establecerErrores] = useState({});
  const [cargando, establecerCargando] = useState(false);

  const manejadorCambio = crearManejadorCambio(establecerDatosFormulario, establecerErrores);
  const manejadorEnvio = crearManejadorEnvioLogin(
    datosFormulario,
    establecerErrores,
    establecerCargando,
    validarFormularioLogin,
    (nombre) => {
      setBienvenida(nombre);
      setTimeout(() => window.location.replace('/'), 2000);
    }
  );

  return (
    <div className="registro-overlay">
      <div className="registro-container">
        <button className="close-btn" onClick={() => navigate('/') }>
          ✕
        </button>

        <div className="registro-header">
          <h2>🐾 Iniciar Sesión</h2>
          <p>Accede a tu cuenta de Sanos y Salvos</p>
        </div>

        <form onSubmit={manejadorEnvio} className="registro-form">
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

          {errores.submit && (
            <div className="error-message-submit">{errores.submit}</div>
          )}

          <a href="#" className="forgot-password">
            ¿Olvidaste tu contraseña?
          </a>

          <button
            type="submit"
            className="btn-submit"
            disabled={cargando}
          >
            {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

            <div className="registro-footer">
              <p>
                ¿No tienes cuenta?{' '}
                <button
                  className="switch-button"
                  onClick={() => navigate('/registro', { state: { backgroundLocation: bgLocation } })}
                >
                  Regístrate aquí
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
