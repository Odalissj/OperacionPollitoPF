// controllers/DonanteController.js

const DonanteModel = require('../models/donanteModel');
const DonacionModel = require('../models/donacionModel');
const BitacoraModel = require('../models/bitacoraModel');
const { normalizePhone } = require('../utils/validation');

/**
 * Controlador para la gestión de Donantes.
 */
class DonanteController {

    /**
     * Obtiene todos los donantes. (GET /api/donantes)
     */
    static async getAllDonantes(req, res) {
        try {
            const donantes = await DonanteModel.findAll();
            res.status(200).json(donantes);
        } catch (error) {
            console.error('Error al obtener donantes:', error.message);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }

    /**
     * Obtiene un donante por ID. (GET /api/donantes/:id)
     */
    static async getDonanteById(req, res) {
        try {
            const { id } = req.params;
            const donante = await DonanteModel.findById(id);

            if (!donante) {
                return res.status(404).json({ message: 'Donante no encontrado.' });
            }
            res.status(200).json(donante);
        } catch (error) {
            console.error('Error al obtener donante por ID:', error.message);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }

    /**
     * Crea un nuevo donante. (POST /api/donantes)
     */
    static async createDonante(req, res) {
        let id = null;
        let donationCreated = false;
        try {
            const data = req.body;
            data.idUsuarioIngreso = Number(req.user.idUsuario);
            data.idUsuarioDonante = Number(req.user.idUsuario);
            
            // Validación mínima
            if (!data.nombre1Donante || !data.apellido1Donante || !data.idUsuarioIngreso) {
                 return res.status(400).json({ message: 'El primer nombre, primer apellido y el usuario de ingreso son obligatorios.' });
            }
            const phone = normalizePhone(data.telefonoDonante);
            if (phone === false) return res.status(400).json({ message: 'El teléfono debe contener entre 8 y 15 dígitos y solo puede usar números, +, espacios, guiones o paréntesis.' });
            data.telefonoDonante = phone;

            const montoDonacionInicial = Number(data.montoDonacionInicial);
            if (!Number.isFinite(montoDonacionInicial) || montoDonacionInicial <= 0) {
                return res.status(400).json({ message: 'El monto de la donación inicial debe ser mayor que cero.' });
            }
            
            // Asumiendo que las FK de ubicación son válidas o se validan en otro middleware/capa
            id = await DonanteModel.create(data);
            const idDonacion = await DonacionModel.create({
                idDonador: id,
                montoDonado: montoDonacionInicial,
                idUsuarioIngreso: data.idUsuarioIngreso,
                descripcionDonacion: 'Donación inicial registrada al crear el donante'
            });
            donationCreated = true;

            await BitacoraModel.create({
                idUsuario: data.idUsuarioIngreso,
                accion: 'INSERT',
                tabla: 'donantes',
                pk_afectada: id.toString(),
                descripcion: `Creación del Donante ID: ${id}`
            });

            res.status(201).json({ 
                message: 'Donante y donación inicial creados con éxito.',
                idDonador: id,
                idDonacion
            });
        } catch (error) {
            console.error('Error al crear donante:', error.message);
            if (id && !donationCreated) {
                try { await DonanteModel.delete(id); } catch (rollbackError) {
                    console.error('No se pudo revertir el donante tras fallar la donación:', rollbackError.message);
                }
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({ message: 'Error de integridad: Una de las claves foráneas (ubicación o usuario) no existe.' });
            }
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }

    /**
     * Actualiza un donante. (PUT /api/donantes/:id)
     */
    static async updateDonante(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            data.idUsuarioActualiza = Number(req.user.idUsuario);
            data.idUsuarioDonante = Number(req.user.idUsuario);

            // Validación mínima
            if (!data.idUsuarioActualiza) {
                 return res.status(400).json({ message: 'El ID de usuario que actualiza es obligatorio.' });
            }
            const phone = normalizePhone(data.telefonoDonante);
            if (phone === false) return res.status(400).json({ message: 'El teléfono debe contener entre 8 y 15 dígitos y solo puede usar números, +, espacios, guiones o paréntesis.' });
            data.telefonoDonante = phone;

            const affectedRows = await DonanteModel.update(id, data);

            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Donante no encontrado o datos idénticos.' });
            }
            
            await BitacoraModel.create({
                idUsuario: data.idUsuarioActualiza,
                accion: 'UPDATE',
                tabla: 'donantes',
                pk_afectada: id.toString(),
                descripcion: `Actualización del Donante ID: ${id}`
            });

            res.status(200).json({ message: 'Donante actualizado con éxito.' });
        } catch (error) {
            console.error('Error al actualizar donante:', error.message);
             if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({ message: 'Error de integridad: Una de las claves foráneas (ubicación o usuario) no existe.' });
            }
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }

    /**
     * Elimina un donante. (DELETE /api/donantes/:id)
     */
    static async deleteDonante(req, res) {
        try {
            const { id } = req.params;
            const affectedRows = await DonanteModel.delete(id);

            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Donante no encontrado.' });
            }
            
            await BitacoraModel.create({
                idUsuario: null,
                accion: 'DELETE',
                tabla: 'donantes',
                pk_afectada: id,
                descripcion: `Donante ID ${id} eliminado.`
            });
            
            res.status(200).json({ message: 'Donante eliminado con éxito.' });
        } catch (error) {
            console.error('Error al eliminar donante:', error.message);
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({ message: 'No se puede eliminar el donante porque tiene Donaciones asociadas.' });
            }
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }
}

module.exports = DonanteController;
