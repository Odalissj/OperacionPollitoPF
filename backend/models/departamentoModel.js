// models/DepartamentoModel.js

const pool = require('../config/dbconfig');

/**
 * Modelo para la tabla Departamentos.
 * Dependencia: Paises
 */
class DepartamentoModel {

    /**
     * Obtiene todos los departamentos, con el nombre del país al que pertenecen.
     */
    static async findAll() {
        const query = `
            SELECT 
                d.idDepartamento, 
                d.nombreDepartamento, 
                d.idPaisDepa, 
                p.nombrePais 
            FROM departamentos d
            JOIN paises p ON d.idPaisDepa = p.idPais
        `;
        const [rows] = await pool.query(query);
        return rows;
    }

    /**
     * Obtiene un departamento por su ID.
     */
    static async findById(id) {
        const query = `
            SELECT 
                d.idDepartamento, 
                d.nombreDepartamento, 
                d.idPaisDepa, 
                p.nombrePais 
            FROM departamentos d
            JOIN paises p ON d.idPaisDepa = p.idPais
            WHERE d.idDepartamento = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    /**
     * Obtiene todos los departamentos de un país específico.
     */
    static async findByPaisId(idPais) {
        const [rows] = await pool.query(
            'SELECT * FROM departamentos WHERE idPaisDepa = ?',
            [idPais]
        );
        return rows;
    }

    /**
     * Crea un nuevo departamento.
     * @param {Object} data - Los datos del nuevo departamento.
     * @param {number} data.idPaisDepa - ID del país al que pertenece.
     * @param {string} data.nombreDepartamento - Nombre del departamento.
     * @returns {Promise<number>} El ID del departamento insertado.
     */
    static async create({ idPaisDepa, nombreDepartamento }) {
        const [result] = await pool.query(
            'INSERT INTO departamentos (idPaisDepa, nombreDepartamento) VALUES (?, ?)',
            [idPaisDepa, nombreDepartamento]
        );
        return result.insertId;
    }

    /**
     * Actualiza la información de un departamento.
     */
    static async update(id, { idPaisDepa, nombreDepartamento }) {
        const [result] = await pool.query(
            'UPDATE departamentos SET idPaisDepa = ?, nombreDepartamento = ? WHERE idDepartamento = ?',
            [idPaisDepa, nombreDepartamento, id]
        );
        return result.affectedRows;
    }

    /**
     * Elimina un departamento por su ID.
     */
    static async delete(id) {
        const [result] = await pool.query('DELETE FROM departamentos WHERE idDepartamento = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = DepartamentoModel;