// config/db.config.js

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  waitForConnections: true,
  // El proxy TCP publico de Railway puede cerrar conexiones inactivas. Mantener
  // pocas conexiones y retirarlas pronto evita reutilizar sockets vencidos.
  connectionLimit: 5,
  maxIdle: 2,
  idleTimeout: 30000,
  queueLimit: 0,
  dateStrings: true,
  ssl: { rejectUnauthorized: false }   // 🔥 requerido por Railway
});

// Un corte de red durante un SELECT no modifica datos y es seguro repetirlo.
// No reintentamos escrituras: el servidor pudo aplicarlas antes del corte.
const query = pool.query.bind(pool);
const retryableReadErrors = new Set([
  'ECONNRESET',
  'EPIPE',
  'PROTOCOL_CONNECTION_LOST',
  'ETIMEDOUT',
]);

pool.query = async function resilientQuery(sql, values) {
  const statement = typeof sql === 'string' ? sql : sql?.sql;
  const isReadOnly = /^\s*(SELECT|SHOW|DESCRIBE|EXPLAIN)\b/i.test(statement || '');

  const maxAttempts = isReadOnly ? 3 : 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await query(sql, values);
    } catch (error) {
      const canRetry = attempt < maxAttempts && retryableReadErrors.has(error.code);
      if (!canRetry) throw error;
      console.warn(`[MySQL] Conexion interrumpida (${error.code}); reintento ${attempt} de ${maxAttempts - 1}.`);
      await new Promise(resolve => setTimeout(resolve, attempt * 400));
    }
  }
};

// ===== Probar conexión =====
module.exports = pool;
