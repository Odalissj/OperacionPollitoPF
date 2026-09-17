require('dotenv').config();
const pool = require('../config/dbconfig');

const trigger = `CREATE TRIGGER tr_detalleventas_after_insert
AFTER INSERT ON detalleventas FOR EACH ROW
BEGIN
  DECLARE vIdBeneficiario INT UNSIGNED;
  DECLARE vIdUsuario INT UNSIGNED;
  DECLARE vIdCaja INT UNSIGNED;
  DECLARE vIdTipoTrx INT UNSIGNED;
  DECLARE vFecha DATE;
  DECLARE vHora TIME;
  DECLARE vAporteIglesia DECIMAL(13,2);
  DECLARE vMontoBeneficiario DECIMAL(13,2);
  DECLARE vNuevoMontoCaja DECIMAL(13,2);
  SELECT idBeneficiarioVenta, idUsuarioIngresa, idCajaVenta, fechaVenta, horaVenta
    INTO vIdBeneficiario, vIdUsuario, vIdCaja, vFecha, vHora
    FROM ventas WHERE idVenta = NEW.idVentaDetalle;
  SET vAporteIglesia = ROUND(NEW.cantidad * 6.50, 2);
  SET vMontoBeneficiario = ROUND(NEW.subtotal - vAporteIglesia, 2);
  IF vMontoBeneficiario < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El precio unitario no puede ser menor que Q6.50.';
  END IF;
  UPDATE inventario SET cantidadVendida = cantidadVendida + NEW.cantidad,
    cantidadActual = cantidadActual - NEW.cantidad, montoTotal = montoTotal + vMontoBeneficiario,
    fechaActualizacion = vFecha, horaActualizacion = vHora, idUsuarioActualiza = vIdUsuario
    WHERE idBeneficiario = vIdBeneficiario;
  UPDATE caja SET montoTotal = montoTotal + vAporteIglesia,
    fechaActualizacion = vFecha, horaActualizacion = vHora, idUsuarioActualiza = vIdUsuario
    WHERE idCaja = vIdCaja;
  SELECT montoTotal INTO vNuevoMontoCaja FROM caja WHERE idCaja = vIdCaja;
  SELECT idTipoTrx INTO vIdTipoTrx FROM tipostransacciones WHERE codigoTrx = 'VEN' LIMIT 1;
  INSERT INTO transaccionescaja (idTipoTrx, montoTrx, nuevoMonto, fechaIngreso,
    horaIngreso, idUsuarioIngreso, idCajaTrx, descripcionTrx, idReferencia, tablaReferencia)
  VALUES (vIdTipoTrx, vAporteIglesia, vNuevoMontoCaja, vFecha, vHora, vIdUsuario,
    vIdCaja, CONCAT('Aporte de venta para la iglesia: Q6.50 x ',
    NEW.cantidad, ' pollito(s).'), NEW.idVentaDetalle, 'ventas');
END`;

(async () => {
  const connection = await pool.getConnection();
  try {
    await connection.query('DROP TRIGGER IF EXISTS tr_ventas_after_insert');
    await connection.query('DROP TRIGGER IF EXISTS tr_detalleventas_after_insert');
    await connection.query(trigger);
    console.log('Distribución de ventas instalada correctamente.');
  } finally {
    connection.release();
    await pool.end();
  }
})().catch(error => {
  console.error(`${error.code || 'ERROR'}: ${error.message}`);
  process.exitCode = 1;
});
