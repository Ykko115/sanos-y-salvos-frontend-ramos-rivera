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
      // Buscar usuario por email y contraseña
      const url = `http://localhost:8080/api/usuario/login`;
      const respuesta = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: datosFormulario.email,
          password: datosFormulario.password,
        }),
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => ({}));
        throw new Error(errorData.message || 'Credenciales incorrectas.');
      }

      // Si el backend retorna el usuario autenticado
      // eslint-disable-next-line no-unused-vars
      const usuario = await respuesta.json();
      // Puedes guardar el usuario en localStorage/sessionStorage si lo necesitas
      // localStorage.setItem('usuario', JSON.stringify(usuario));

      alert('¡Bienvenido!');
      alCerrar();
    } catch (error) {
      establecerErrores({ submit: error.message || 'Error al iniciar sesión. Intenta nuevamente.' });
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
        telefono: datosFormulario.telefono ? Number(datosFormulario.telefono) : undefined,
        password: datosFormulario.password,
      };

      // Enviar datos al backend
      const respuesta = await fetch('http://localhost:8080/api/usuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosEnvio),
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al registrarse. Intenta nuevamente.');
      }

      alert('¡Registro exitoso! Bienvenido a Sanos y Salvos');
      alCerrar();
    } catch (error) {
      establecerErrores({ submit: error.message || 'Error al registrarse. Intenta nuevamente.' });
    } finally {
      establecerCargando(false);
    }
  };
};
