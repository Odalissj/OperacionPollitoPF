// models/InventarioModel.js

const pool = require('../config/dbconfig');

/**
 * Modelo para la tabla Inventario (Stock por Beneficiario).
 * Dependencias: Beneficiarios, Usuarios (2 veces)
 */
class InventarioModel {

    /**
     * Obtiene todos los registros de inventario con los nombres de los beneficiarios y usuarios.
     */
static async findAll() {
    const query = `
        SELECT
            i.idInventario,
            i.idBeneficiario,
            CONCAT_WS(' ', b.nombre1Beneficiario,
                NULLIF(b.nombre2Beneficiario, ''), NULLIF(b.nombre3Beneficiario, ''),
                b.apellido1Beneficiario, NULLIF(b.apellido2Beneficiario, ''),
                NULLIF(b.apellido3Beneficiario, '')) AS nombreBeneficiario,
            i.cantidadInicial,
            i.cantidadVendida,
            i.cantidadConsumida,
            i.cantidadActual,
            i.ultimaCantidadIngre,
            i.montoTotal,
            i.fechaIngreso,
            i.fechaActualizacion,
            i.idUsuarioIngreso,
            i.idUsuarioActualiza,
            u_ing.nombreUsuario AS usuarioIngreso,
            u_act.nombreUsuario AS usuarioActualiza
        FROM inventario i
        LEFT JOIN beneficiarios b 
            ON i.idBeneficiario = b.idBeneficiario
        LEFT JOIN usuarios u_ing 
            ON i.idUsuarioIngreso = u_ing.idUsuario
        LEFT JOIN usuarios u_act 
            ON i.idUsuarioActualiza = u_act.idUsuario
        ORDER BY i.fechaActualizacion DESC
    `;
    const [rows] = await pool.query(query);
    return rows;
}


    /**
     * Obtiene el registro de inventario de un beneficiario específico.
     * Asumimos que hay un registro de inventario por beneficiario.
     */

  // Buscar inventario por beneficiario
  static async findByBeneficiario(idBeneficiario) {
    const [rows] = await pool.query(
      'SELECT * FROM inventario WHERE idBeneficiario = ?',
      [idBeneficiario]
    );
    return rows[0] || null;
  }

  // Crear inventario inicial de beneficiario
  static async createInicial({ idBeneficiario, cantidad, idUsuario }, connection = pool) {
    const [result] = await connection.query(
      `INSERT INTO inventario (
        idBeneficiario,
        cantidadInicial,
        cantidadVendida,
        cantidadConsumida,
        cantidadActual,
        ultimaCantidadIngre,
        montoTotal,
        fechaIngreso,
        horaIngreso,
        idUsuarioIngreso,
        fechaActualizacion,
        horaActualizacion,
        idUsuarioActualiza
      )
      VALUES (?, ?, 0, 0, ?, ?, 0, CURDATE(), CURTIME(), ?, CURDATE(), CURTIME(), ?)`,
      [idBeneficiario, cantidad, cantidad, cantidad, idUsuario, idUsuario]
    );
    return result.insertId;
  }

  // Actualizar inventario al entregar pollitos
  static async actualizarEntrega({ idBeneficiario, cantidad, idUsuario }) {
    const [result] = await pool.query(
      `UPDATE inventario
       SET cantidadActual = cantidadActual + ?,
           ultimaCantidadIngre = ?,
           fechaActualizacion = CURDATE(),
           horaActualizacion = CURTIME(),
           idUsuarioActualiza = ?
       WHERE idBeneficiario = ?`,
      [cantidad, cantidad, idUsuario, idBeneficiario]
    );
    return result.affectedRows;
  }

}

module.exports = InventarioModel;
