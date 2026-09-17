require('dotenv').config();
const pool = require('../config/dbconfig');

const checks = {
  paises: () => require('../models/paisModel').findAll(),
  departamentos: () => require('../models/departamentoModel').findAll(),
  municipios: () => require('../models/municipioModel').findAll(),
  lugares: () => require('../models/lugarModel').findAll(),
  roles: () => require('../models/rolModel').findAll(),
  usuarios: () => require('../models/usuarioModel').findAll(),
  encargados: () => require('../models/EncargadoModel').findAll(),
  beneficiarios: () => require('../models/beneficiarioModel').findAll(),
  contactos: () => require('../models/beneficiarioContactoModel').findAll(),
  donantes: () => require('../models/donanteModel').findAll(),
  donaciones: () => require('../models/donacionModel').findAll(),
  compras: () => require('../models/compraModel').findAll(),
  ventas: () => require('../models/ventaModel').findAll(),
  inventario: () => require('../models/inventarioModel').findAll(),
  inventarioGeneral: () => require('../models/InventarioGeneralModel').findAll(),
  caja: () => require('../models/cajaModel').find(),
  movimientos: () => require('../models/transaccionCajaModel').findAll(),
};

(async () => {
  const results = {};
  for (const [name, check] of Object.entries(checks)) {
    try {
      const value = await check();
      results[name] = { ok: true, rows: Array.isArray(value) ? value.length : value ? 1 : 0 };
    } catch (error) {
      results[name] = { ok: false, error: error.message };
    }
  }
  console.log(JSON.stringify(results, null, 2));
  await pool.end();
  if (Object.values(results).some(result => !result.ok)) process.exitCode = 1;
})().catch(async error => {
  console.error(error.message);
  await pool.end();
  process.exitCode = 1;
});
