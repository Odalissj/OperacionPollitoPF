const pool = require('../config/dbconfig');

class MovimientoInventarioModel {
  static async ensureTable(connection = pool) {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS movimientosinventariogeneral (
        idMovimiento BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        tipoMovimiento VARCHAR(30) NOT NULL,
        naturaleza ENUM('E','S') NOT NULL,
        cantidad INT UNSIGNED NOT NULL,
        saldoResultante INT UNSIGNED NULL,
        idBeneficiario INT UNSIGNED NULL,
        nombreBeneficiario VARCHAR(320) NULL,
        idUsuario INT UNSIGNED NULL,
        nombreUsuario VARCHAR(50) NULL,
        idReferencia BIGINT UNSIGNED NULL,
        fechaMovimiento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        descripcion VARCHAR(255) NULL,
        PRIMARY KEY (idMovimiento),
        UNIQUE KEY uk_movimiento_origen (tipoMovimiento, idReferencia)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  static async backfill() {
    await this.ensureTable();
    await pool.query(`
      INSERT IGNORE INTO movimientosinventariogeneral
        (tipoMovimiento, naturaleza, cantidad, idUsuario, nombreUsuario, idReferencia, fechaMovimiento, descripcion)
      SELECT 'COMPRA', 'E', c.cantidadCompra, c.idUsuarioIngresa, u.nombreUsuario, c.idCompra,
             TIMESTAMP(c.fechaCompra, c.horaCompra), 'Ingreso por compra de pollitos'
      FROM compras c LEFT JOIN usuarios u ON u.idUsuario = c.idUsuarioIngresa
    `);
    await pool.query(`
      INSERT IGNORE INTO movimientosinventariogeneral
        (tipoMovimiento, naturaleza, cantidad, idBeneficiario, nombreBeneficiario, idUsuario, nombreUsuario, idReferencia, fechaMovimiento, descripcion)
      SELECT 'ASIGNACION_INICIAL', 'S', i.cantidadInicial, i.idBeneficiario,
             CONCAT_WS(' ', b.nombre1Beneficiario, NULLIF(b.nombre2Beneficiario,''), NULLIF(b.nombre3Beneficiario,''), b.apellido1Beneficiario, NULLIF(b.apellido2Beneficiario,''), NULLIF(b.apellido3Beneficiario,'')),
             i.idUsuarioIngreso, u.nombreUsuario, i.idInventario, TIMESTAMP(i.fechaIngreso, i.horaIngreso),
             'Inventario inicial asignado al beneficiario'
      FROM inventario i
      JOIN beneficiarios b ON b.idBeneficiario = i.idBeneficiario
      LEFT JOIN usuarios u ON u.idUsuario = i.idUsuarioIngreso
      WHERE i.cantidadInicial > 0
    `);
  }

  static async record(data, connection = pool) {
    const [result] = await connection.query(`
      INSERT INTO movimientosinventariogeneral
        (tipoMovimiento, naturaleza, cantidad, saldoResultante, idBeneficiario, nombreBeneficiario,
         idUsuario, nombreUsuario, idReferencia, descripcion)
      SELECT ?, ?, ?, ig.cantidadActual, ?,
             CONCAT_WS(' ', b.nombre1Beneficiario, NULLIF(b.nombre2Beneficiario,''), NULLIF(b.nombre3Beneficiario,''), b.apellido1Beneficiario, NULLIF(b.apellido2Beneficiario,''), NULLIF(b.apellido3Beneficiario,'')),
             ?, u.nombreUsuario, ?, ?
      FROM inventariogeneral ig
      LEFT JOIN beneficiarios b ON b.idBeneficiario = ?
      LEFT JOIN usuarios u ON u.idUsuario = ?
      WHERE ig.idInventarioGeneral = 1
    `, [data.tipoMovimiento, data.naturaleza, data.cantidad, data.idBeneficiario || null,
      data.idUsuario, data.idReferencia || null, data.descripcion || null,
      data.idBeneficiario || null, data.idUsuario]);
    return result.insertId;
  }

  static async findAll() {
    await this.backfill();
    const [rows] = await pool.query(`
      SELECT tipoMovimiento, naturaleza, cantidad, saldoResultante,
             nombreBeneficiario, nombreUsuario, fechaMovimiento, descripcion
      FROM movimientosinventariogeneral
      ORDER BY fechaMovimiento DESC, idMovimiento DESC
    `);
    return rows;
  }
}

module.exports = MovimientoInventarioModel;
