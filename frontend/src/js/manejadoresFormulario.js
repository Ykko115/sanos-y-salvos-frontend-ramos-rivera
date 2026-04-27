export const crearManejadorCambio = (establecerDatosFormulario, establecerErrores) => {
  return (e) => {
    const { name, value } = e.target;
    establecerDatosFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));

    if (establecerErrores) {
      establecerErrores((anterior) => ({
        ...anterior,
        [name]: '',
      }));
    }
  };
};

export const crearManejadorEnvioLogin = (
  datosFormulario,
  establecerErrores,
  establecerCargando,
  validarFormularioLogin,
  alCerrar
) => {
  return async (e) => {
    e.preventDefault();

    const errores = validarFormularioLogin(datosFormulario);

    if (Object.keys(errores).length > 0) {
      establecerErrores(errores);
      return;
    }

    establecerCargando(true);

    try {
      console.log('Datos de login:', datosFormulario);

      setTimeout(() => {
        alert('¡Bienvenido!');
        alCerrar();
      }, 500);
    } catch (error) {
      establecerErrores({ submit: 'Error al iniciar sesión. Intenta nuevamente.' });
    } finally {
      establecerCargando(false);
    }
  };
};

export const crearManejadorEnvioRegistro = (
  datosFormulario,
  establecerErrores,
  establecerCargando,
  validarFormularioRegistro,
  alCerrar
) => {
  return async (e) => {
    e.preventDefault();

    const errores = validarFormularioRegistro(datosFormulario);

    if (Object.keys(errores).length > 0) {
      establecerErrores(errores);
      return;
    }

    establecerCargando(true);

    try {
      const datosEnvio = {
        rut: datosFormulario.rut,
        nombre: datosFormulario.nombre,
        apellido: datosFormulario.apellido,
        email: datosFormulario.email,
        telefono: parseInt(datosFormulario.telefono),
        password: datosFormulario.password,
      };

      console.log('Datos de registro:', datosEnvio);

      setTimeout(() => {
        alert('¡Registro exitoso! Bienvenido a Sanos y Salvos');
        alCerrar();
      }, 500);
    } catch (error) {
      establecerErrores({ submit: 'Error al registrarse. Intenta nuevamente.' });
    } finally {
      establecerCargando(false);
    }
  };
};
