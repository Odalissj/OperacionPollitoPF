const pool = require('../config/dbconfig');

class ComprasModel {
  // ============================
  // LISTAR TODAS LAS COMPRAS (con filtros opcionales)
  // ============================
 static async findAll(filtros = {}) {
    const { desde, hasta, idCaja } = filtros;

    let sql = `
      SELECT 
        c.idCompra,
        c.idCajaCompra,
        c.cantidadCompra,
        c.totalCompra,
        c.fechaCompra,
        c.horaCompra,
        c.idUsuarioIngresa,
        u.nombreUsuario AS usuarioIngresaNombre
      FROM compras c
      LEFT JOIN usuarios u
        ON c.idUsuarioIngresa = u.idUsuario
    `;

    const where = [];
    const params = [];

    // ⚠️ Usamos DATE() por si fechaCompra es DATETIME
    if (desde) {
      where.push('DATE(c.fechaCompra) >= ?');
      params.push(desde);
    }

    if (hasta) {
      where.push('DATE(c.fechaCompra) <= ?');
      params.push(hasta);
    }

    if (idCaja) {
      where.push('c.idCajaCompra = ?');
      params.push(Number(idCaja));
    }

    if (where.length) {
      sql += ' WHERE ' + where.join(' AND ');
    }

    sql += `
      ORDER BY c.fechaCompra DESC, c.horaCompra DESC, c.idCompra DESC
    `;

    // Para ver qué está pasando en consola si quieres depurar:

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  // ============================
  // CREAR COMPRA
  // ============================
  static async create(data, conn = null) {
    const {
      idCajaCompra,
      cantidadCompra,
      totalCompra,
      fechaCompra = null,
      horaCompra  = null,
      idUsuarioIngresa,
      descripcionCompra = null,
    } = data;
    const connection = conn || await pool.getConnection();
    try {
      await connection.query(
        'CALL sp_registrar_compra(?, ?, ?, ?, ?, @idCompra)',
        [idCajaCompra, cantidadCompra, totalCompra, idUsuarioIngresa, descripcionCompra]
      );
      const [[result]] = await connection.query('SELECT @idCompra AS idCompra');
      return result.idCompra;
    } finally {
      if (!conn) connection.release();
    }
  }
}

module.exports = ComprasModel;
