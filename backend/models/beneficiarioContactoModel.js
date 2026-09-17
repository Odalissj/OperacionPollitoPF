const pool = require('../config/dbconfig');

class BeneficiarioContactoModel {
  static async findAll() {
    const [rows] = await pool.query(`
      SELECT bc.*, CONCAT_WS(' ', b.nombre1Beneficiario,
        NULLIF(b.nombre2Beneficiario, ''), NULLIF(b.nombre3Beneficiario, ''),
        b.apellido1Beneficiario, NULLIF(b.apellido2Beneficiario, ''),
        NULLIF(b.apellido3Beneficiario, '')) nombreBeneficiario
      FROM beneficiariocontactos bc
      JOIN beneficiarios b ON b.idBeneficiario = bc.idBeneficiario
      ORDER BY bc.activo DESC, bc.esPrincipal DESC, bc.actualizadoEn DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM beneficiariocontactos WHERE idContactoBeneficiario = ?', [id]);
    return rows[0] || null;
  }

  static async create(data) {
    const [result] = await pool.query(`
      INSERT INTO beneficiariocontactos
        (idBeneficiario, telefono, nombreContacto, parentesco, esPrincipal, activo, observaciones)
      VALUES (?, ?, NULLIF(?, ''), NULLIF(?, ''), ?, ?, NULLIF(?, ''))
    `, [data.idBeneficiario, data.telefono, data.nombreContacto, data.parentesco, Number(data.esPrincipal), Number(data.activo), data.observaciones]);
    return result.insertId;
  }

  static async update(id, data) {
    const [result] = await pool.query(`
      UPDATE beneficiariocontactos SET idBeneficiario = ?, telefono = ?,
        nombreContacto = NULLIF(?, ''), parentesco = NULLIF(?, ''),
        esPrincipal = ?, activo = ?, observaciones = NULLIF(?, '')
      WHERE idContactoBeneficiario = ?
    `, [data.idBeneficiario, data.telefono, data.nombreContacto, data.parentesco, Number(data.esPrincipal), Number(data.activo), data.observaciones, id]);
    return result.affectedRows;
  }
}

module.exports = BeneficiarioContactoModel;
