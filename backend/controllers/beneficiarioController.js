// controllers/BeneficiarioController.js

const BeneficiarioModel = require('../models/beneficiarioModel'); // Corregido a mayúscula (Encargado)
const EncargadoModel = require('../models/EncargadoModel');
const BitacoraModel = require('../models/bitacoraModel'); // Corregido a mayúscula (Encargado)

const InventarioModel = require('../models/inventarioModel');
const InventarioGeneralModel = require('../models/InventarioGeneralModel');
const pool = require('../config/dbconfig');
const MovimientoInventarioModel = require('../models/movimientoInventarioModel');

const INVENTARIO_INICIAL = 5;

/**
 * Controlador para la gestión de Beneficiarios.
 */
class BeneficiarioController {

    // ... (getAllBeneficiarios y getBeneficiarioById se mantienen igual)
    static async getAllBeneficiarios(req, res) {
        try {
            const { q = '', estado = '' } = req.query;   // /api/beneficiarios?q=juan&estado=A

            const beneficiarios = await BeneficiarioModel.findAll({
                q: q.trim(),
                estado: estado.trim().toUpperCase()
            });

            res.status(200).json(beneficiarios);
        } catch (error) {
            console.error('Error al obtener beneficiarios:', error.message);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }
    
    static async getBeneficiarioById(req, res) {
        try {
            const { id } = req.params;
            const beneficiario = await BeneficiarioModel.findById(id);

            if (!beneficiario) {
                return res.status(404).json({ message: 'Beneficiario no encontrado.' });
            }
            res.status(200).json(beneficiario);
        } catch (error) {
            console.error('Error al obtener beneficiario por ID:', error.message);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }
    // ...

    /**
     * Crea un nuevo beneficiario. (POST /api/beneficiarios)
     */
    static async createBeneficiario(req, res) {
        let connection;
        try {
            const data = req.body;
            data.idUsuarioIngreso = Number(req.user.idUsuario);
            data.estadoBeneficiario = 'A';
            data.tipoIdentificacion = data.numeroIdentificacion?.trim() ? 'OTRO' : null;
            
            // VALIDACIÓN MÍNIMA y ESTRICTA DE TODOS los campos NOT NULL requeridos por la DB
            if (
                !data.nombre1Beneficiario || !data.apellido1Beneficiario ||
                !data.idPaisBene || !data.idDepartamentoBene || 
                !data.idMunicipioBene || !data.idLugarBene || !data.estadoBeneficiario || 
                !data.idUsuarioIngreso
            ) {
                 return res.status(400).json({ 
                    message: 'Faltan campos obligatorios: primer nombre, primer apellido, ubicación, estado y usuario de ingreso.' 
                });
            }
            
            // Asignar un valor por defecto si no se recibe (opcional, pero útil)
            data.estadoBeneficiario = data.estadoBeneficiario.toUpperCase();
            
            // Opcional: Validación de existencia del Encargado (se mantiene la lógica)
            if (data.idEncargadoBene) {
                const encargado = await EncargadoModel.findById(data.idEncargadoBene);
                if (!encargado) return res.status(400).json({ message: 'El encargado proporcionado no existe.' });
            }

            await MovimientoInventarioModel.ensureTable();
            connection = await pool.getConnection();
            await connection.beginTransaction();

            const inventarioGeneral = await InventarioGeneralModel.getActualForUpdate(connection);
            if (!inventarioGeneral || Number(inventarioGeneral.cantidadActual) < INVENTARIO_INICIAL) {
                const inventoryError = new Error(`La iglesia necesita al menos ${INVENTARIO_INICIAL} pollitos disponibles para registrar al beneficiario.`);
                inventoryError.code = 'INVENTARIO_INSUFICIENTE';
                throw inventoryError;
            }

            const id = await BeneficiarioModel.create(data, connection);
            const idInventario = await InventarioModel.createInicial({
                idBeneficiario: id,
                cantidad: INVENTARIO_INICIAL,
                idUsuario: data.idUsuarioIngreso
            }, connection);
            await InventarioGeneralModel.bajarStock({
                cantidad: INVENTARIO_INICIAL,
                idUsuario: data.idUsuarioIngreso
            }, connection);
            await MovimientoInventarioModel.record({
                tipoMovimiento: 'ASIGNACION_INICIAL', naturaleza: 'S', cantidad: INVENTARIO_INICIAL,
                idBeneficiario: id, idUsuario: data.idUsuarioIngreso, idReferencia: idInventario,
                descripcion: 'Inventario inicial asignado al beneficiario'
            }, connection);
            await connection.commit();

            await BitacoraModel.create({
                idUsuario: data.idUsuarioIngreso,
                accion: 'INSERT',
                tabla: 'beneficiarios',
                pk_afectada: id.toString(),
                descripcion: `Creación del Beneficiario ID: ${id}`
            });

            res.status(201).json({ 
                message: `Beneficiario creado con éxito y ${INVENTARIO_INICIAL} pollitos asignados.`,
                idBeneficiario: id,
                cantidadInicial: INVENTARIO_INICIAL
            });
        } catch (error) {
            if (connection) await connection.rollback();
            console.error('Error al crear beneficiario:', error.message);
            if (error.code === 'INVENTARIO_INSUFICIENTE') {
                return res.status(409).json({ message: error.message });
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_ROW_DOES_NOT_EXIST') {
                return res.status(400).json({ message: 'Error de integridad: Una de las claves foráneas (ubicación, encargado o usuario) no existe.' });
            }
            res.status(500).json({ message: 'Error interno del servidor.' });
        } finally {
            if (connection) connection.release();
        }
    }

    /**
     * Actualiza un beneficiario. (PUT /api/beneficiarios/:id)
     */
    static async updateBeneficiario(req, res) {
        // ... (Se debe corregir la validación de campos obligatorios también)
        try {
            const { id } = req.params;
            const data = req.body;
            data.tipoIdentificacion = data.numeroIdentificacion?.trim() ? 'OTRO' : null;

            // Validación de campos obligatorios para UPDATE (ajustar según el modelo)
            if (
                !data.nombre1Beneficiario || !data.apellido1Beneficiario ||
                !data.idPaisBene || !data.idDepartamentoBene || !data.idMunicipioBene || 
                !data.idLugarBene || !data.estadoBeneficiario || !data.idUsuarioActualiza
            ) {
                 return res.status(400).json({ message: 'Faltan campos obligatorios para la actualización.' });
            }
            
            data.estadoBeneficiario = data.estadoBeneficiario.toUpperCase();

            const affectedRows = await BeneficiarioModel.update(id, data);

            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Beneficiario no encontrado o datos idénticos.' });
            }
            
            await BitacoraModel.create({
                idUsuario: data.idUsuarioActualiza,
                accion: 'UPDATE',
                tabla: 'beneficiarios',
                pk_afectada: id.toString(),
                descripcion: `Actualización del Beneficiario ID: ${id}`
            });

            res.status(200).json({ message: 'Beneficiario actualizado con éxito.' });
        } catch (error) {
            console.error('Error al actualizar beneficiario:', error.message);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }
    // ... (deleteBeneficiario se mantiene igual)
}

module.exports = BeneficiarioController;
