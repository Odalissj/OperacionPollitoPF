// controllers/CajaController.js

// Nota: Asegúrate que los nombres de archivo de tus modelos sean exactamente como están aquí
const CajaModel = require('../models/cajaModel'); // Corregido el nombre
const TransaccionCajaModel = require('../models/transaccionCajaModel'); // Corregido el nombre
const pool = require('../config/dbconfig'); // <-- Corregido: Usar 'db.config'

/**
 * Controlador para la gestión de la Caja (monto único y movimientos).
 * Asumimos que idCaja es 1.
 */
class CajaController {

    /**
     * Obtiene el estado actual de la caja. (GET /api/caja/estado)
     */
    static async getCajaStatus(req, res) {
        try {
            // Llama al modelo sin bloqueo (solo lectura)
            const caja = await CajaModel.find(); 
            
            // Si no existe, devuelve 0 y mensaje de inicialización
            if (!caja) {
                return res.status(200).json({ 
                    idCaja: 1, 
                    montoTotal: 0.00, 
                    message: 'Caja no inicializada. Monto por defecto es 0.' 
                });
            }
            res.status(200).json(caja);
        } catch (error) {
            console.error('Error al obtener estado de caja:', error.message);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }

    /**
     * Realiza un ingreso o egreso de caja (Manual). (POST /api/caja/movimiento)
     * Requiere: monto, idTipoTrx, descripcionTrx, idUsuarioIngreso.
     * **DEBE ser atómico:** Actualizar Caja y registrar TransaccionCaja.
     */
    static async createMovimiento(req, res) {
        const { montoTrx, descripcionTrx, idUsuarioIngreso } = req.body;
        
        if (!montoTrx || !descripcionTrx || !idUsuarioIngreso) {
            return res.status(400).json({ message: 'Monto, descripción y usuario son obligatorios.' });
        }
        
        if (typeof montoTrx !== 'number' || isNaN(montoTrx) || montoTrx === 0) {
            return res.status(400).json({ message: 'montoTrx debe ser un número válido y diferente de cero.' });
        }

        const tipo = req.body.tipo || (montoTrx < 0 ? 'S' : 'E');
        try {
            await pool.query('CALL sp_ajustar_caja(?, ?, ?, ?, ?)', [
                1, tipo, Math.abs(montoTrx), idUsuarioIngreso, descripcionTrx
            ]);
            return res.status(201).json({ message: 'Ajuste de caja registrado con éxito.' });
        } catch (error) {
            console.error('Error al ajustar caja:', error.message);
            const status = error.sqlState === '45000' ? 400 : 500;
            return res.status(status).json({ message: status === 400 ? error.message : 'Error interno al ajustar la caja.' });
        }

        /* Compatibilidad histórica; el nuevo esquema utiliza sp_ajustar_caja.
        let connection;
        try {
            // 1. Iniciar Transacción y obtener conexión
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 🛑 NUEVA LÍNEA: Aumenta el timeout de bloqueo a 60 segundos solo para esta conexión.
        await connection.query('SET innodb_lock_wait_timeout = 60');

            // 2. Obtener monto actual y calcular el nuevo monto
            // ¡IMPORTANTE! Llamar al modelo con 'connection' y 'true' para BLOQUEAR la fila.
            const cajaActual = await CajaModel.find(connection, true); 
            
            const montoInicial = cajaActual ? parseFloat(cajaActual.montoTotal) : 0;
            const nuevoMonto = montoInicial + montoTrx;

            if (nuevoMonto < 0) {
                await connection.rollback();
                return res.status(400).json({ message: 'La operación resultaría en un saldo de caja negativo.' });
            }

            // 3. Actualizar el Monto de Caja (usando la conexión de la transacción)
            await connection.query(
                `INSERT INTO caja (idCaja, montoTotal, fechaActualizacion, horaActualizacion, idUsuarioActualiza) 
                 VALUES (1, ?, CURDATE(), CURTIME(), ?)
                 ON DUPLICATE KEY UPDATE 
                    montoTotal = VALUES(montoTotal),
                    fechaActualizacion = CURDATE(),
                    horaActualizacion = CURTIME(),
                    idUsuarioActualiza = VALUES(idUsuarioActualiza) `,
                [nuevoMonto, idUsuarioIngreso]
            );

            // 4. Registrar la Transacción (Movimiento)
            const trxData = {
                idTipoTrx, 
                montoTrx, 
                nuevoMonto, 
                idUsuarioIngreso, 
                idCajaTrx: 1, 
                descripcionTrx
            };
            // Aseguramos que el método create del modelo use la conexión
            const idTransaccion = await TransaccionCajaModel.create(trxData, connection); 

            // 5. Commit de la Transacción
            await connection.commit();

            res.status(201).json({ 
                message: 'Movimiento de caja registrado con éxito.', 
                idTransaccion, 
                montoAnterior: montoInicial,
                montoNuevo: nuevoMonto
            });
        } catch (error) {
            if (connection) {
                // Si algo falla, hacemos ROLLBACK
                await connection.rollback(); 
            }
            console.error('Error en la transacción de caja:', error.message);
            // Si el error es el timeout, devolvemos un mensaje más útil
            if (error.message.includes('Lock wait timeout exceeded')) {
                res.status(503).json({ 
                    message: 'Tiempo de espera de bloqueo excedido. Intenta de nuevo. (Revisa si hay otra transacción activa).',
                    details: error.message
                });
            } else {
                 res.status(500).json({ message: 'Error interno del servidor al procesar el movimiento de caja.' });
            }
        } finally {
            if (connection) {
                // ¡Liberar la conexión!
                connection.release();
            }
        }
        */
    }
    static async getResumenDiario(req, res) {
    try {
      // solo manejamos caja 1
      const resumen = await TransaccionCajaModel.getResumenDiario(1);
      return res.status(200).json(resumen);
    } catch (error) {
      console.error('Error al obtener resumen diario de caja:', error.message);
      return res
        .status(500)
        .json({ message: 'Error interno del servidor al obtener el resumen diario.' });
    }
  }

  /**
   * Últimos movimientos de caja (GET /api/caja/ultimos-movimientos?limit=5)
   */
  static async getUltimosMovimientos(req, res) {
    try {
      const { limit } = req.query;

      const movimientos = await TransaccionCajaModel.getUltimosMovimientos({
        idCaja: 1,
        limit,
      });

      return res.status(200).json(movimientos);
    } catch (error) {
      console.error('Error al obtener últimos movimientos de caja:', error.message);
      return res
        .status(500)
        .json({ message: 'Error interno del servidor al obtener los movimientos.' });
    }
  }
}

module.exports = CajaController;
