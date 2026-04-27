export const validarCorreo = (correo) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
};

export const validarRUT = (rut) => {
  const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}[-]?[0-9K]$/;
  return rutRegex.test(rut);
};

export const validarTelefono = (telefono) => {
  return /^\+?56\d{9}$|^\d{9}$/.test(telefono.replace(/\s/g, ''));
};

export const validarContraseñaFuerte = (contraseña) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!*\-_]).{8,}$/.test(contraseña);
};

export const validarFormularioLogin = (datosFormulario) => {
  const nuevosErrores = {};

  if (!datosFormulario.email) {
    nuevosErrores.email = 'El correo es requerido';
  } else if (!validarCorreo(datosFormulario.email)) {
    nuevosErrores.email = 'Ingresa un correo válido';
  }

  if (!datosFormulario.password) {
    nuevosErrores.password = 'La contraseña es requerida';
  } else if (!validarContraseñaFuerte(datosFormulario.password)) {
    nuevosErrores.password = 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales (@, #, $, !, *, -, _)';
  }

  return nuevosErrores;
};

export const validarFormularioRegistro = (datosFormulario) => {
  const nuevosErrores = {};

  if (!datosFormulario.rut) {
    nuevosErrores.rut = 'El RUT es requerido';
  } else if (!validarRUT(datosFormulario.rut)) {
    nuevosErrores.rut = 'Ingresa un RUT válido (ej: 12.345.678-9)';
  }

  if (!datosFormulario.nombre) {
    nuevosErrores.nombre = 'El nombre es requerido';
  } else if (datosFormulario.nombre.length < 3) {
    nuevosErrores.nombre = 'El nombre debe tener al menos 3 caracteres';
  }

  if (!datosFormulario.apellido) {
    nuevosErrores.apellido = 'El apellido es requerido';
  } else if (datosFormulario.apellido.length < 3) {
    nuevosErrores.apellido = 'El apellido debe tener al menos 3 caracteres';
  }

  if (!datosFormulario.email) {
    nuevosErrores.email = 'El correo es requerido';
  } else if (!validarCorreo(datosFormulario.email)) {
    nuevosErrores.email = 'Ingresa un correo válido';
  }

  if (!datosFormulario.telefono) {
    nuevosErrores.telefono = 'El teléfono es requerido';
  } else if (!validarTelefono(datosFormulario.telefono)) {
    nuevosErrores.telefono = 'Ingresa un teléfono válido';
  }

  if (!datosFormulario.password) {
    nuevosErrores.password = 'La contraseña es requerida';
  } else if (!validarContraseñaFuerte(datosFormulario.password)) {
    nuevosErrores.password = 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales (@, #, $, !, *, -, _)';
  }

  if (!datosFormulario.confirmPassword) {
    nuevosErrores.confirmPassword = 'Confirma tu contraseña';
  } else if (datosFormulario.password !== datosFormulario.confirmPassword) {
    nuevosErrores.confirmPassword = 'Las contraseñas no coinciden';
  }

  return nuevosErrores;
};
