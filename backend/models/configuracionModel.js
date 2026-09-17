const pool = require('../config/dbconfig');

class ConfiguracionModel {
  static async ensureTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS configuracionsistema (
        clave VARCHAR(60) NOT NULL,
        valor VARCHAR(255) NOT NULL,
        fechaActualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        idUsuarioActualiza INT UNSIGNED NULL,
        PRIMARY KEY (clave),
        CONSTRAINT configuracion_usuario_fk FOREIGN KEY (idUsuarioActualiza)
          REFERENCES usuarios (idUsuario) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await pool.query(`INSERT IGNORE INTO configuracionsistema (clave, valor) VALUES ('metaDonaciones', '2000')`);
  }

  static async getMetaDonaciones() {
    await this.ensureTable();
    const [rows] = await pool.query(`SELECT valor, fechaActualizacion FROM configuracionsistema WHERE clave = 'metaDonaciones'`);
    return { metaDonaciones: Number(rows[0]?.valor || 2000), fechaActualizacion: rows[0]?.fechaActualizacion || null };
  }

  static async updateMetaDonaciones(meta, idUsuario) {
    await this.ensureTable();
    await pool.query(`
      INSERT INTO configuracionsistema (clave, valor, idUsuarioActualiza)
      VALUES ('metaDonaciones', ?, ?)
      ON DUPLICATE KEY UPDATE valor = VALUES(valor), idUsuarioActualiza = VALUES(idUsuarioActualiza)
    `, [meta, idUsuario]);
    return this.getMetaDonaciones();
  }
}

module.exports = ConfiguracionModel;
