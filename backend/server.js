// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const cors        = require('cors');
const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./config/swaggerconfig');
const pool        = require('./config/dbconfig');
const authenticate = require('./middlewares/authMiddleware');
const errorHandler = require('./middlewares/errorMiddleware');
const enforceReadOnlyRole = require('./middlewares/readOnlyRole');

// Rutas
const catalogosRoutes     = require('./routes/catalogosRoutes');
const geografiaRoutes     = require('./routes/geografiaroutes');
const personasRoutes      = require('./routes/personasRoutes');
const transaccionesRoutes = require('./routes/transaccionesRoutes');
const seguridadRoutes     = require('./routes/seguridaRoutes');   // <- tu archivo real
const comprasRoutes       = require('./routes/compras');
const lugaresRoutes       = require('./routes/lugaresRoutes');
const configuracionRoutes = require('./routes/configuracionRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ===== CORS (simplificado, permite todo origen local) ===== */
app.use(cors()); // permite todos los orígenes (no usas credenciales, así que no hay problema)

/* ===== Parsers ===== */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

/* ===== Swagger ===== */
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
// Servir archivos estáticos del frontend (carpetas fuera de /backend)
/* ===== API ===== */
app.use('/api', authenticate);
app.use('/api', seguridadRoutes);       // /api/auth/login, /api/auth/logout, etc.
app.use('/api', enforceReadOnlyRole);
app.use('/api', catalogosRoutes);
app.use('/api', geografiaRoutes);
app.use('/api', personasRoutes);
app.use('/api', transaccionesRoutes);
app.use('/api', comprasRoutes);
app.use('/api', lugaresRoutes);
app.use('/api', configuracionRoutes);

/* ===== Health & Home ===== */
app.get('/api/health', async (_req, res) => {
  try {
    const [r] = await pool.query('SELECT DATABASE() db, CURRENT_USER() user');
    res.json({ ok: true, db: r[0]?.db || null, user: r[0]?.user || null });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/*app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'API del Sistema de Gestión de Beneficiarios en Node.js (MVC) en funcionamiento. Visita /docs para la documentación.',
    version: '1.0'
  });
});*/
/* ===== Frontend React (producción) ===== */
const reactDist = path.join(__dirname, '..', 'frontend', 'dist');

if (fs.existsSync(reactDist)) {
  app.use(express.static(reactDist));
  app.get(/^(?!\/api(?:\/|$)|\/docs(?:\/|$)).*/, (_req, res) => {
    res.sendFile(path.join(reactDist, 'index.html'));
  });
}

/* ===== 404 de API ===== */
app.use('/api', (req, res) =>
  res.status(404).json({ message: `Ruta no encontrada: ${req.originalUrl}` })
);

app.use(errorHandler);

/* ===== Start ===== */
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📘 Documentación disponible en http://localhost:${PORT}/docs`);
    try {
      const [rows] = await pool.query('SELECT DATABASE() db');
      console.log(
        rows[0]?.db
          ? `✅ Conectado a BD: ${rows[0].db}`
          : '⚠️ No hay BD seleccionada. Revisa DB_NAME en .env y database en dbconfig.'
      );
    } catch (e) {
      console.error('❌ Error al conectar a la base de datos:', e.message);
    }
  });
}

module.exports = app;
