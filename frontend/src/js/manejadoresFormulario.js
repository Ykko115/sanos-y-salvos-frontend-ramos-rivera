function extraerToken(data) {
  if (!data || typeof data !== 'object') return null;
  const conocido = data.token || data.accessToken || data.access_token || data.jwt || data.jwtToken;
  if (conocido) return conocido;
  // Buscar cualquier string con formato JWT en este nivel
  for (const val of Object.values(data)) {
    if (typeof val === 'string' && val.startsWith('eyJ')) return val;
  }
  // Buscar recursivamente en objetos anidados (ej: data.user.token)
  for (const val of Object.values(data)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const anidado = extraerToken(val);
      if (anidado) return anidado;
    }
  }
  return null;
}

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
      const respuesta = await fetch(`/api/usuario/login`, {
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
        throw new Error(errorData.message || errorData.error || 'Credenciales incorrectas.');
      }

      const usuario = await respuesta.json();

      const token = extraerToken(usuario);
      let exp = usuario.exp;
      if (!exp) {
        exp = Math.floor(Date.now() / 1000) + 86400;
      }
      const usuarioConExp = { ...usuario, token, exp };
      localStorage.setItem('usuario', JSON.stringify(usuarioConExp));

      const nombre = usuario.user?.nombre || usuario.nombre || 'Usuario';
      alCerrar(nombre);
      // Recarga limpia para inicializar el estado/socket con el nuevo usuario
      // y no arrastrar notificaciones del usuario anterior.
      window.location.assign('/');
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

      const respuesta = await fetch('/api/usuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosEnvio),
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Error al registrarse. Intenta nuevamente.');
      }

      const usuarioRegistrado = await respuesta.json();
      const token = extraerToken(usuarioRegistrado);
      let exp = usuarioRegistrado.exp;
      if (!exp) {
        exp = Math.floor(Date.now() / 1000) + 86400;
      }
      const usuarioConExp = { ...usuarioRegistrado, token, exp };
      localStorage.setItem('usuario', JSON.stringify(usuarioConExp));

      alCerrar();
      // Recarga limpia para inicializar el estado/socket con el nuevo usuario.
      window.location.assign('/');
    } catch (error) {
      establecerErrores({ submit: error.message || 'Error al registrarse. Intenta nuevamente.' });
    } finally {
      establecerCargando(false);
    }
  };
};
