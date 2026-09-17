# Operación Pollito

Aplicación de gestión con frontend React + Tailwind CSS y API Node.js + Express + MySQL.

## Arquitectura

La aplicación utiliza MVC adaptado a una SPA:

- **Vista:** React y Tailwind CSS en `frontend/src`.
- **Controladores:** `backend/controllers`.
- **Modelos:** `backend/models`, conectados a MySQL.
- **Rutas:** `backend/routes`, API REST bajo `/api`.
- **Middleware:** autenticación JWT y errores en `backend/middlewares`.

El frontend HTML/Bootstrap anterior quedó archivado en `legacy-frontend`. Express
ya no lo publica ni lo utiliza; puede retirarse definitivamente después de validar
los datos reales en el entorno con MySQL.

## Desarrollo

Primero instala ambos proyectos:

```powershell
npm.cmd run install:all
```

En una terminal:

```powershell
cd backend
npm.cmd install
npm.cmd run dev
```

En otra terminal:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

El frontend estará en `http://localhost:5173` y enviará `/api` al backend en
`http://localhost:3000` mediante el proxy de Vite.

## Producción

```powershell
npm.cmd run build
npm.cmd start
```

Express sirve automáticamente `frontend/dist` y conserva la API bajo `/api`.

Configura `VITE_API_URL` únicamente si el frontend y el backend se publican en
dominios diferentes. Para un solo despliegue se utiliza `/api` por defecto.
# Recuperación de contraseña

El acceso incluye la opción **¿Olvidaste tu contraseña?**. El enlace generado vence en 15 minutos y solo puede utilizarse una vez.

Para enviar correos configura en `backend/.env` y en las variables del backend desplegado en Railway:

```env
FRONTEND_URL=http://localhost:5173
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=Operación Pollito <no-reply@tu-dominio.com>
```

En producción, `FRONTEND_URL` debe ser la dirección pública del frontend. Si `RESEND_API_KEY` no está configurada, el backend imprime el enlace en su consola para permitir pruebas locales.
