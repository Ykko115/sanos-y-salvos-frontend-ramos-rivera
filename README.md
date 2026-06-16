# Sanos y Salvos — Frontend

Aplicación web para reportar y encontrar mascotas perdidas. Desarrollada con **React 19 + Vite** como parte del proyecto **Sanos y Salvos** de los estudiantes **Nicolás Ramos** y **Alberto Rivera** — Instituto Profesional DUOC UC, FullStack 3.

---

## Descripción

Sanos y Salvos es una plataforma que permite a los usuarios:

- Registrar mascotas propias con sus características detalladas.
- Publicar reportes de mascotas **perdidas** o **encontradas**.
- Visualizar reportes en un **mapa interactivo** con geolocalización.
- Recibir **notificaciones en tiempo real** cuando se detecta una coincidencia con su mascota.
- Acceder a un **panel de administración** para gestionar usuarios, mascotas y reportes.

---

## Stack tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 19 | Framework de UI |
| Vite | 8 | Bundler y servidor de desarrollo |
| React Router DOM | 7 | Navegación SPA con rutas modales |
| Bootstrap | 5.3 | Estilos y componentes UI |
| Leaflet + React-Leaflet | 1.9 / 5 | Mapa interactivo |
| Socket.IO Client | 4.8 | Notificaciones en tiempo real |

---

## Requisitos previos

- Node.js 18+
- npm 9+
- Backend Spring Boot corriendo en `http://localhost:8080`
- Servidor Node/Socket.IO corriendo en `http://localhost:3001`

---

## Instalación y ejecución

El proyecto requiere dos procesos corriendo en paralelo:

**Terminal 1 — Servidor Socket.IO** (notificaciones en tiempo real):
```bash
cd /ruta/al/repo
npm install
npm start
```

**Terminal 2 — Frontend Vite**:
```bash
cd frontend
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

### Otros comandos

```bash
npm run build      # Genera el build de producción en dist/
npm run preview    # Sirve el build de producción localmente
npm run lint       # Ejecuta ESLint
```

---

## Variables de entorno

Crear un archivo `frontend/.env.local` con:

```env
VITE_API_URL=http://localhost:8080
```

---

## Funcionalidades principales

### Autenticación y sesión
- Registro e inicio de sesión con JWT.
- El token JWT tiene una duración de **10 minutos**. Al expirar, el `Navbar` detecta la expiración automáticamente (polling cada 1 segundo), borra `localStorage` y redirige al inicio cerrando la sesión.
- La decodificación del JWT usa Base64URL correctamente (`-` → `+`, `_` → `/`) para garantizar la detección de expiración en todos los casos.

### Mascotas
- Registro de mascotas con especie, raza, color, tamaño, señas y foto.
- Listado de mascotas propias en `/mis-mascotas`.
- Edición de datos de mascotas registradas.

### Reportes
- Crear reporte de mascota perdida o encontrada con ubicación en mapa.
- Visualizar todos los reportes activos en `/reportes` con mapa interactivo.
- Modal de detalle de reporte con información completa.

### Notificaciones en tiempo real
- Conexión WebSocket directa al servidor Node en `http://localhost:3001` (en desarrollo), usando transporte WebSocket puro para evitar errores de proxy con Vite.
- Banner de notificación cuando el sistema detecta coincidencias con la mascota del usuario.
- Eventos: `nueva_coincidencia`, `nuevo_reporte`, `mascota_reunida`, `alerta_refugio`.

### Panel de Administración (`/admin`)
- `AdminUsuarios` — listado y gestión de todos los usuarios.
- `AdminMascotas` — listado y gestión de todas las mascotas.
- `AdminReportes` — listado y gestión de todos los reportes.

---

## Rutas de la aplicación

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | `Home` | Página principal con mapa y reportes recientes |
| `/perfil` | `Perfil` | Perfil del usuario autenticado |
| `/mis-mascotas` | `MisMascotas` | Mascotas registradas por el usuario |
| `/login` | `Login` | Inicio de sesión (modal) |
| `/registro` | `Registro` | Registro de nuevo usuario (modal) |
| `/reportes` | `Reportes` | Listado de reportes (modal) |
| `/nuevo-reporte` | `NuevoReporte` | Crear nuevo reporte (modal) |
| `/registromascota` | `RegistroMascota` | Registrar mascota (modal) |
| `/modalreporte/:id` | `ModalReporte` | Detalle de un reporte (modal) |
| `/admin` | `AdminPanel` | Panel de administración |
| `/admin/usuarios` | `AdminUsuarios` | Gestión de usuarios |
| `/admin/mascotas` | `AdminMascotas` | Gestión de mascotas |
| `/admin/reportes` | `AdminReportes` | Gestión de reportes |

> Las rutas de modal se renderizan sobre la página actual usando el patrón **background location** de React Router.

---

## Proxy Vite (desarrollo)

Las peticiones en desarrollo se enrutan así (`vite.config.js`):

| Ruta | Destino | Descripción |
|------|---------|-------------|
| `/api/reportes/resumen` | `localhost:3001` | Resumen estadístico (Node) |
| `/api/reportes/exportar` | `localhost:3001` | Exportar PDF/XLSX (Node) |
| `/api/notificar` | `localhost:3001` | Webhooks de notificación (Node) |
| `/api/*` | `localhost:8080` | API Gateway Spring Boot |

> Socket.IO **no** pasa por el proxy de Vite — se conecta directamente a `localhost:3001` para evitar errores de WebSocket.

---

## Estructura del proyecto

```
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/               # Imágenes y SVGs
│   ├── components/
│   │   ├── admin/            # AdminPanel, AdminUsuarios, AdminMascotas, AdminReportes
│   │   ├── Notificaciones/   # BannerNotif
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Registro.jsx
│   │   ├── Navbar.jsx        # Incluye auto-logout por expiración de JWT
│   │   ├── Footer.jsx
│   │   ├── MapaInteractivo.jsx
│   │   ├── MisMascotas.jsx
│   │   ├── RegistroMascota.jsx
│   │   ├── EditarMascota.jsx
│   │   ├── Reportes.jsx
│   │   ├── NuevoReporte.jsx
│   │   └── ModalReporte.jsx
│   ├── context/
│   │   └── AppContext.jsx     # Estado global (usuario, notificaciones, coincidencias)
│   ├── hooks/
│   │   ├── useSocket.js       # Conexión WebSocket directa a localhost:3001
│   │   ├── useCoincidencias.js
│   │   ├── useNotificacionesDB.js
│   │   ├── useMisReportes.js
│   │   └── useReporte.js
│   ├── js/
│   │   ├── auth.js            # getToken(), getAuthHeaders() — decodifica JWT en Base64URL
│   │   ├── manejadoresFormulario.js
│   │   ├── validaciones.js
│   │   └── server.js          # Servidor Express + Socket.IO (puerto 3001)
│   ├── App.jsx
│   └── main.jsx
├── index.html
└── vite.config.js
```

---

## Autores

- **Nicolás Ramos** — [@Ykko115](https://github.com/Ykko115)
- **Alberto Rivera**

Instituto Profesional DUOC UC — Carrera FullStack, 2026.
