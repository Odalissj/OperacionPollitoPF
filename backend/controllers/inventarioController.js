// controllers/InventarioController.js
const pool = require('../config/dbconfig');
const InventarioModel = require('../models/inventarioModel');
const InventarioGeneralModel = require('../models/InventarioGeneralModel');
const MovimientoInventarioModel = require('../models/movimientoInventarioModel');

/**
 * Controlador para la gestión de Inventario.
 * Nota: Los métodos de actualización principales se harán a través de VentaController y DonacionController (no implementado).
 * Aquí solo incluimos el CRUD base para inicializar y consultar.
 */
class InventarioController {
    
    /**
     * Obtiene todos los registros de inventario. (GET /api/inventario)
     */
    static async getAllInventario(req, res) {
        try {
            const inventarios = await InventarioModel.findAll();
            res.status(200).json(inventarios);
        } catch (error) {
            console.error('Error al obtener inventario:', error.message);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }

    /**
     * Obtiene el inventario por ID de beneficiario. (GET /api/inventario/beneficiario/:id)
     */
    static async getInventarioByBeneficiarioId(req, res) {
    try {
      const { id } = req.params;
      const inv = await InventarioModel.findByBeneficiario(id);   // 👈 usar método correcto

      if (!inv) {
        // devolvemos 0 en lugar de error 404 para que el front funcione sencillo
        return res.status(200).json({ idBeneficiario: id, cantidadActual: 0 });
      }
      res.status(200).json(inv);
    } catch (err) {
      console.error('[Inventario] Error al obtener inventario de beneficiario:', err);
      res.status(500).json({ message: 'Error interno al obtener inventario de beneficiario.' });
    }
  }

    /**
     * Inicializa el inventario para un beneficiario. (POST /api/inventario)
     * Solo debe ser llamado una vez por beneficiario.
     */
    static async createInventario(req, res) {
        try {
            const data = req.body;

            // Validación mínima para inicialización
            if (!data.idBeneficiario || !data.idUsuarioIngreso) {
                 return res.status(400).json({ message: 'El ID de beneficiario y el usuario de ingreso son obligatorios.' });
            }
            
            // Prevenir duplicados (aunque la DB lo haría, es mejor validarlo aquí)
            const exists = await InventarioModel.findByBeneficiarioId(data.idBeneficiario);
            if (exists) {
                return res.status(409).json({ message: 'El inventario para este beneficiario ya fue inicializado.' });
            }

            // Establecer valores iniciales si no se proporcionan (deberían ser 0)
            data.cantidadInicial = data.cantidadInicial || 0;
            data.cantidadVendida = 0;
            data.cantidadConsumida = 0;
            data.cantidadActual = data.cantidadInicial;
            data.ultimaCantidadIngre = data.cantidadInicial;
            data.montoTotal = data.montoTotal || 0.00;


            const id = await InventarioModel.create(data);

            // Se puede omitir la bitácora aquí, ya que el InventarioController.js
            // no maneja la lógica de negocio principal de transacciones.
            // Si quieres registrar, usa BitacoraModel.create() aquí.

            res.status(201).json({ 
                message: 'Inventario inicializado con éxito.', 
                idInventario: id 
            });
        } catch (error) {
            console.error('Error al inicializar inventario:', error.message);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }
    static async getInventarioGeneral(req, res) {
    try {
      const inv = await InventarioGeneralModel.getActual();
      if (!inv) {
        return res.status(200).json({
          idInventarioGeneral: 1,
          cantidadActual: 0
        });
      }
      // aseguramos que cantidadActual venga claro
      res.status(200).json({
        idInventarioGeneral: inv.idInventarioGeneral,
        cantidadActual: inv.cantidadActual,
        ultimaCantidadIngre: inv.ultimaCantidadIngre,
        fechaIngreso: inv.fechaIngreso,
        horaIngreso: inv.horaIngreso,
        fechaActualizacion: inv.fechaActualizacion,
        horaActualizacion: inv.horaActualizacion,
        usuarioIngresoNombre: inv.usuarioIngresoNombre,
        usuarioActualizaNombre: inv.usuarioActualizaNombre
      });
    } catch (err) {
      console.error('[Inventario] Error al obtener inventario general:', err);
      res.status(500).json({ message: 'Error interno al obtener inventario general.' });
    }
  }



  // POST /api/inventario/entregar
  static async entregarPollitos(req, res) {
    await MovimientoInventarioModel.ensureTable();
    const conn = await pool.getConnection();
    try {
      const { idBeneficiario, cantidad, idUsuario } = req.body;

      if (!idBeneficiario || !cantidad || cantidad <= 0 || !idUsuario) {
        return res.status(400).json({ message: 'Datos inválidos.' });
      }

      await conn.beginTransaction();

      const invG = await InventarioGeneralModel.getActual();
      if (!invG) {
        await conn.rollback();
        return res.status(500).json({ message: 'Inventario general no encontrado.' });
      }

      if (invG.cantidadActual < cantidad) {
        await conn.rollback();
        return res.status(400).json({ message: 'No hay suficientes pollitos en inventario general.' });
      }

      await InventarioGeneralModel.bajarStock({ cantidad, idUsuario }, conn);

      const invB = await InventarioModel.findByBeneficiario(idBeneficiario);

      if (!invB) {
        await conn.query(
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
          VALUES (?, 0, 0, 0, ?, ?, 0, CURDATE(), CURTIME(), ?, CURDATE(), CURTIME(), ?)`,
          [idBeneficiario, cantidad, cantidad, idUsuario, idUsuario]
        );
      } else {
        await conn.query(
          `UPDATE inventario
           SET cantidadActual = cantidadActual + ?,
               ultimaCantidadIngre = ?,
               fechaActualizacion = CURDATE(),
               horaActualizacion = CURTIME(),
               idUsuarioActualiza = ?
           WHERE idBeneficiario = ?`,
          [cantidad, cantidad, idUsuario, idBeneficiario]
        );
      }

      await MovimientoInventarioModel.record({
        tipoMovimiento: 'ENTREGA', naturaleza: 'S', cantidad: Number(cantidad),
        idBeneficiario: Number(idBeneficiario), idUsuario: Number(idUsuario),
        descripcion: 'Entrega adicional al beneficiario'
      }, conn);

      await conn.commit();
      res.status(200).json({ message: 'Entrega registrada exitosamente.' });

    } catch (err) {
      await conn.rollback();
      console.error('[Inventario] Error en entregarPollitos:', err);
      res.status(500).json({ message: 'Error interno al registrar la entrega.' });
    } finally {
      conn.release();
    }
  }
}

module.exports = InventarioController;
