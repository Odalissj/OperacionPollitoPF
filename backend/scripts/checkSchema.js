require('dotenv').config();
const pool = require('../config/dbconfig');

const requiredColumns = {
  usuarios: ['correoUsuario', 'estadoUsuario'],
  beneficiarios: ['tipoIdentificacion', 'numeroIdentificacion', 'nombreConocidoComo', 'fechaNacimiento', 'anioNacimientoAprox', 'referenciaUbicacion', 'observaciones'],
  beneficiariocontactos: ['telefono', 'esPrincipal', 'activo'],
  donantes: ['correoDonante'],
  compras: ['descripcionCompra'],
  ventas: ['idCajaVenta', 'observaciones'],
  donaciones: ['idCajaDonacion', 'descripcionDonacion'],
  tipostransacciones: ['naturaleza'],
};
const requiredRoutines = ['sp_registrar_compra', 'sp_registrar_donacion', 'sp_entregar_inventario_beneficiario', 'sp_registrar_venta', 'sp_ajustar_caja', 'sp_buscar_posibles_beneficiarios'];
const requiredViews = ['vw_beneficiarios_busqueda', 'vw_movimientos_caja'];

(async () => {
  const [columns] = await pool.query(`SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()`);
  const present = new Set(columns.map(c => `${c.TABLE_NAME}.${c.COLUMN_NAME}`.toLowerCase()));
  const missingColumns = Object.entries(requiredColumns).flatMap(([table, names]) => names.filter(name => !present.has(`${table}.${name}`.toLowerCase())).map(name => `${table}.${name}`));
  const [routines] = await pool.query(`SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE()`);
  const routineSet = new Set(routines.map(r => r.ROUTINE_NAME.toLowerCase()));
  const [views] = await pool.query(`SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA = DATABASE()`);
  const viewSet = new Set(views.map(v => v.TABLE_NAME.toLowerCase()));
  const missingRoutines = requiredRoutines.filter(name => !routineSet.has(name));
  const missingViews = requiredViews.filter(name => !viewSet.has(name));
  const ok = !missingColumns.length && !missingRoutines.length && !missingViews.length;
  console.log(JSON.stringify({ ok, missingColumns, missingRoutines, missingViews }, null, 2));
  await pool.end();
  process.exitCode = ok ? 0 : 1;
})().catch(async error => {
  console.error(error.message);
  await pool.end();
  process.exitCode = 1;
});
