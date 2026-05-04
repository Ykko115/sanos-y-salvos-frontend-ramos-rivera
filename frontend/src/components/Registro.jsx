import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validarFormularioRegistro } from '../js/validaciones';
import { crearManejadorCambio, crearManejadorEnvioRegistro } from '../js/manejadoresFormulario';
import '../css/Registro.css';

export default function Registro() {
  const navigate = useNavigate();
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
    () => navigate('/')
  );

  return (
    <div className="registro-overlay">
      <div className="registro-container">
        <button className="close-btn" onClick={() => navigate('/') }>
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
                onChange={e => {
                  let raw = e.target.value.replace(/[^\dkK]/g, "");
                  let v = raw;
                  if (raw.length > 1) {
                    if (raw.length <= 8) {
                      // 2.171.447-7
                      v = raw.replace(/(\d{1})(\d{3})?(\d{0,3})?([\dkK])?$/, (m, g1, g2, g3, g4) => {
                        let out = g1;
                        if (g2) out += '.' + g2;
                        if (g3) out += '.' + g3;
                        if (g4) out += '-' + g4;
                        return out;
                      });
                    } else {
                      // 21.714.477-9
                      v = raw.replace(/(\d{2})(\d{3})?(\d{0,3})?([\dkK])?$/, (m, g1, g2, g3, g4) => {
                        let out = g1;
                        if (g2) out += '.' + g2;
                        if (g3) out += '.' + g3;
                        if (g4) out += '-' + g4;
                        return out;
                      });
                    }
                  }
                  establecerDatosFormulario(anterior => ({ ...anterior, rut: v }));
                  if (establecerErrores) establecerErrores(anterior => ({ ...anterior, rut: '' }));
                }}
                placeholder="21.714.477-9"
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
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 4, color: '#888' }}>+56</span>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={(() => {
                  // Formatea el valor para mostrarlo con espacios
                  let raw = datosFormulario.telefono.replace(/[^\d]/g, '');
                  if (!raw) return '';
                  let out = raw[0] || '';
                  if (raw.length > 1) out += ' ' + raw.slice(1, 5);
                  if (raw.length > 5) out += ' ' + raw.slice(5, 9);
                  if (raw.length > 9) out += ' ' + raw.slice(9, 13);
                  return out;
                })()}
                onChange={e => {
                  // Solo números, sin espacios ni +56
                  let value = e.target.value.replace(/[^\d]/g, '');
                  establecerDatosFormulario(anterior => ({ ...anterior, telefono: value }));
                  if (establecerErrores) establecerErrores(anterior => ({ ...anterior, telefono: '' }));
                }}
                placeholder="9 1234 5678"
                className={errores.telefono ? 'input-error' : ''}
                style={{ flex: 1 }}
                maxLength={12}
              />
            </div>
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
              onClick={() => navigate('/login')}
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
