const ConfiguracionModel = require('../models/configuracionModel');
const BitacoraModel = require('../models/bitacoraModel');

class ConfiguracionController {
  static async getMeta(req, res) {
    try { return res.json(await ConfiguracionModel.getMetaDonaciones()); }
    catch (error) { console.error('Error al consultar la meta:', error.message); return res.status(500).json({ message: 'No fue posible consultar la meta.' }); }
  }

  static async updateMeta(req, res) {
    try {
      const meta = Number(req.body?.metaDonaciones);
      if (!Number.isFinite(meta) || meta <= 0) return res.status(400).json({ message: 'La meta debe ser mayor que cero.' });
      const result = await ConfiguracionModel.updateMetaDonaciones(meta.toFixed(2), req.user.idUsuario);
      await BitacoraModel.create({ idUsuario: req.user.idUsuario, accion: 'UPDATE', tabla: 'configuracionsistema', pk_afectada: 'metaDonaciones', descripcion: `Meta de donaciones actualizada a Q ${meta.toFixed(2)}` });
      return res.json({ message: 'Meta actualizada correctamente.', ...result });
    } catch (error) { console.error('Error al actualizar la meta:', error.message); return res.status(500).json({ message: 'No fue posible actualizar la meta.' }); }
  }
}

module.exports = ConfiguracionController;
