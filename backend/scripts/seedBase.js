require('dotenv').config();
const pool = require('../config/dbconfig');

(async () => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(`INSERT INTO roles (idRol, nombreRol, descripcionRol) VALUES
      (1, 'ADMIN', 'Administración completa del sistema'),
      (2, 'OPERADOR', 'Acceso operativo completo excepto usuarios, roles y configuración administrativa'),
      (3, 'CONSULTA', 'Acceso de solo lectura a las consultas del sistema')
      ON DUPLICATE KEY UPDATE nombreRol = VALUES(nombreRol), descripcionRol = VALUES(descripcionRol)`);
    await connection.query(`INSERT INTO tipostransacciones (idTipoTrx, codigoTrx, descripcionTrx, naturaleza) VALUES
      (1, 'COM', 'Compra: salida de caja', 'S'),
      (2, 'DON', 'Donación: entrada a caja', 'E'),
      (3, 'VEN', 'Venta: entrada a caja', 'E'),
      (4, 'AJI', 'Ajuste manual de entrada', 'E'),
      (5, 'AJE', 'Ajuste manual de salida', 'S')
      ON DUPLICATE KEY UPDATE codigoTrx = VALUES(codigoTrx), descripcionTrx = VALUES(descripcionTrx), naturaleza = VALUES(naturaleza)`);
    await connection.query(`INSERT INTO caja (idCaja, nombreCaja, montoTotal) VALUES (1, 'Caja principal', 0.00) ON DUPLICATE KEY UPDATE nombreCaja = VALUES(nombreCaja)`);
    await connection.query(`INSERT INTO inventariogeneral (idInventarioGeneral, cantidadActual, ultimaCantidadIngre) VALUES (1, 0, 0) ON DUPLICATE KEY UPDATE idInventarioGeneral = idInventarioGeneral`);
    await connection.commit();
    console.log('Catálogos, caja e inventario general inicializados correctamente.');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
