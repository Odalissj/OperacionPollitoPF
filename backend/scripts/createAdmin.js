require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/dbconfig');

(async () => {
  const nombreUsuario = process.env.BOOTSTRAP_ADMIN_USERNAME;
  const contrasena = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const correoUsuario = process.env.BOOTSTRAP_ADMIN_EMAIL || null;

  if (!nombreUsuario || !contrasena || contrasena.length < 12) {
    throw new Error('Define BOOTSTRAP_ADMIN_USERNAME y BOOTSTRAP_ADMIN_PASSWORD (mínimo 12 caracteres) solo para ejecutar este comando.');
  }

  const [roles] = await pool.query("SELECT idRol FROM roles WHERE nombreRol = 'ADMIN' LIMIT 1");
  if (!roles.length) throw new Error('El rol ADMIN no existe. Importa primero el esquema nuevo.');
  const [existing] = await pool.query('SELECT idUsuario FROM usuarios WHERE nombreUsuario = ? LIMIT 1', [nombreUsuario]);
  if (existing.length) throw new Error('Ese administrador ya existe; no se hicieron cambios.');

  const hash = await bcrypt.hash(contrasena, 12);
  await pool.query(`INSERT INTO usuarios (nombreUsuario, contrasena, correoUsuario, idRol, estadoUsuario) VALUES (?, ?, ?, ?, 'A')`, [nombreUsuario, hash, correoUsuario, roles[0].idRol]);
  console.log('Administrador inicial creado correctamente. Elimina las variables BOOTSTRAP_ADMIN_* de inmediato.');
  await pool.end();
})().catch(async error => {
  console.error(error.message);
  await pool.end();
  process.exitCode = 1;
});
