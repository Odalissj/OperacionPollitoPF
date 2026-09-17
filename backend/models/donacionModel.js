// models/donacionModel.js
const pool = require('../config/dbconfig');

/**
 * Donaciones SIN tipos.
 * Guarda: idDonador, montoDonado, fecha/hora (auto),
 * idUsuarioIngreso y idUsuarioActualizacion.
 */
class DonacionModel {
  // ==========================
  // LISTAR TODAS (con nombres)
  // ==========================
  static async findAll() {
    const [rows] = await pool.query(`
      SELECT 
        d.idDonacion,
        d.idDonador,
        d.montoDonado,
        d.fechaIngreso,
        d.horaIngreso,
        d.idUsuarioIngreso,
        d.fechaActualizacion,
        d.horaActualizacion,
        d.IdUsuarioActualizacion,

        -- nombre del donante
        CONCAT_WS(' ', da.nombre1Donante,
          NULLIF(da.nombre2Donante, ''), NULLIF(da.nombre3Donante, ''),
          da.apellido1Donante, NULLIF(da.apellido2Donante, ''),
          NULLIF(da.apellido3Donante, '')) AS nombreDonante,

        -- nombres de usuarios
        uIng.nombreUsuario AS usuarioIngresoNombre,
        uAct.nombreUsuario AS usuarioActualizaNombre
      FROM donaciones d
      JOIN donantes da
        ON d.idDonador = da.idDonador
      JOIN usuarios uIng
        ON d.idUsuarioIngreso = uIng.idUsuario
      JOIN usuarios uAct
        ON d.IdUsuarioActualizacion = uAct.idUsuario
      ORDER BY d.fechaIngreso DESC, d.horaIngreso DESC
    `);

    // LOG opcional para verificar que esto SÍ se está usando
    return rows;
  }

  // ==========================
  // OBTENER UNA POR ID
  // ==========================
  static async findById(id) {
    const sql = `
      SELECT
        idDonacion,
        idDonador,
        montoDonado,
        fechaIngreso,
        horaIngreso,
        idUsuarioIngreso,
        fechaActualizacion,
        horaActualizacion,
        IdUsuarioActualizacion
      FROM donaciones
      WHERE idDonacion = ?
      LIMIT 1
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  }

  // ==========================
  // CREAR
  // ==========================
  static async create({
    idDonador,
    montoDonado,
    idUsuarioIngreso,
    idCajaDonacion = 1,
    descripcionDonacion = null,
    fechaIngreso = null,
    horaIngreso = null
  }) {
    const user = Number(idUsuarioIngreso) || 1;
    const connection = await pool.getConnection();
    try {
      await connection.query(
        'CALL sp_registrar_donacion(?, ?, ?, ?, ?, @idDonacion)',
        [Number(idDonador), Number(idCajaDonacion), Number(montoDonado), user, descripcionDonacion]
      );
      const [[result]] = await connection.query('SELECT @idDonacion AS idDonacion');
      return result.idDonacion;
    } finally {
      connection.release();
    }
  }

  // ==========================
  // ELIMINAR
  // ==========================
  static async delete(id) {
    const [r] = await pool.query(
      'DELETE FROM donaciones WHERE idDonacion = ?',
      [id]
    );
    return r.affectedRows;
  }
}

module.exports = DonacionModel;
