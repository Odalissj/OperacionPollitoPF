// config/db.config.js

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  ssl: { rejectUnauthorized: false }   // 🔥 requerido por Railway
});

// ===== Probar conexión =====
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Conexión exitosa a Railway MySQL');
    conn.release();
  } catch (err) {
    console.error('❌ Error al conectar:', err.message);
  }
}
testConnection();

module.exports = pool;
