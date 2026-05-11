# Sanos y Salvos

![React](https://img.shields.io/badge/React-18+-61dafb?logo=react&logoColor=white)
![NPM](https://img.shields.io/badge/NPM-Package-red?logo=npm)

## 🩺 Descripción general del proyecto y flujo de la aplicación

**Sanos y Salvos** es el frontend de una plataforma veterinaria, desarrollado como una Single Page Application (SPA) utilizando React. El proyecto está empaquetado como un componente NPM y se comunica exclusivamente con el Backend For Frontend (BFF), que actúa como apigateway implementado en Spring Boot. El flujo de la aplicación permite a los usuarios navegar entre las distintas vistas (inicio, login, registro, etc.) sin recargar la página, gestionando el estado y la comunicación con el backend de manera eficiente y segura.

## 🛠️ Tecnologías utilizadas

- **React** 18+
- **JavaScript** (ES6+)
- **CSS**
- **NPM** (Node Package Manager)
- **Vite** (empaquetador y servidor de desarrollo)

## 🧩 Patrones de diseño implementados

- **Observer**: Implementado mediante los React Hooks `useState` y `useEffect` para la gestión reactiva del estado y la suscripción a cambios en los datos.

## 🏗️ Arquitectura de componentes React (estructura de carpetas src/)

La arquitectura del frontend sigue una estructura modular y escalable:

```
frontend/src/
├── App.jsx
├── App.css
├── index.css
├── main.jsx
├── assets/
├── components/
│   ├── Footer.jsx
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Navbar.jsx
│   └── Registro.jsx
├── css/
│   ├── Footer.css
│   ├── Home.css
│   ├── Login.css
│   ├── Navbar.css
│   └── Registro.css
└── js/
	├── manejadoresFormulario.js
	└── validaciones.js
```

## ⚙️ Requisitos previos

- **Node.js** v18 o superior
- **NPM** v9 o superior

## 📦 Instrucciones de instalación

Ejecutar en la raíz del proyecto:

```
npm install
```

## 🚀 Instrucciones de ejecución

Para iniciar el servidor de desarrollo:

```
npm run dev
```

O, si está configurado:

```
npm start
```

## 🧪 Cómo ejecutar las pruebas

```
npm test
```

## 🔑 Variable de entorno necesaria

Debe configurarse la variable de entorno para apuntar al BFF (apigateway backend):

- Para Vite: `VITE_API_URL`
- Para Create React App: `REACT_APP_API_URL`

Ejemplo en `.env.local`:

```
VITE_API_URL=https://url-del-bff
```

## 📁 Estructura de carpetas del repositorio

```
/
├── package.json
├── README.md
└── frontend/
	├── eslint.config.js
	├── index.html
	├── package.json
	├── README.md
	├── vite.config.js
	├── public/
	└── src/
		├── App.css
		├── App.jsx
		├── index.css
		├── main.jsx
		├── assets/
		├── components/
		├── css/
		└── js/
```

## 👥 Integrantes

- **Nicolás Ramos**
- **Alberto Rivera**

DuocUC — DSY1106 Desarrollo Fullstack III
