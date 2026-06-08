export function getToken() {
  try {
    const sesion = JSON.parse(localStorage.getItem('usuario') || '{}');
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
  } catch {
    return null;
  }
}

// Devuelve los headers HTTP con Authorization solo si hay token válido
export function getAuthHeaders(conContentType = true) {
  const token = getToken();
  const headers = {};
  if (conContentType) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}
