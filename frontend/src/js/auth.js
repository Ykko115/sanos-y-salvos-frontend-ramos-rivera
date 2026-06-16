function jwtEstaExpirado(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp != null && payload.exp * 1000 < Date.now();
  } catch {
    return false;
  }
}

function extraerCandidato(sesion) {
  const directo = sesion.token || sesion.accessToken || sesion.access_token
    || sesion.jwt || sesion.jwtToken || sesion.bearerToken;
  if (directo) return directo;
  for (const val of Object.values(sesion)) {
    if (typeof val === 'string' && val.startsWith('eyJ')) return val;
  }
  if (sesion.user && typeof sesion.user === 'object') {
    const anidado = sesion.user.token || sesion.user.accessToken
      || sesion.user.jwt || sesion.user.jwtToken;
    if (anidado) return anidado;
    for (const val of Object.values(sesion.user)) {
      if (typeof val === 'string' && val.startsWith('eyJ')) return val;
    }
  }
  return null;
}

export function getToken() {
  try {
    const sesion = JSON.parse(localStorage.getItem('usuario') || '{}');
    const token = extraerCandidato(sesion);
    if (!token) return null;
    if (jwtEstaExpirado(token)) {
      localStorage.removeItem('usuario');
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

// Devuelve los headers HTTP con Authorization solo si hay token vigente
export function getAuthHeaders(conContentType = true) {
  const token = getToken();
  const headers = {};
  if (conContentType) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// Lanza un Error con el status HTTP si la respuesta no es ok.
// Solo elimina la sesión cuando el token local ya está expirado (getToken devuelve null),
// no ante cualquier 401 del backend.
export function verificarRespuesta(res) {
  if (!res.ok) {
    const err = new Error(`Error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res;
}
