const Model = require('../models/beneficiarioContactoModel');
const { normalizePhone } = require('../utils/validation');

class BeneficiarioContactoController {
  static async getAll(_req, res) {
    try { res.json(await Model.findAll()); }
    catch (error) { console.error(error); res.status(500).json({ message: 'No se pudieron obtener los contactos.' }); }
  }
  static async getById(req, res) {
    try {
      const row = await Model.findById(req.params.id);
      if (!row) return res.status(404).json({ message: 'Contacto no encontrado.' });
      return res.json(row);
    } catch (error) { console.error(error); return res.status(500).json({ message: 'No se pudo obtener el contacto.' }); }
  }
  static async create(req, res) {
    try {
      if (!req.body.idBeneficiario || !req.body.telefono) return res.status(400).json({ message: 'Beneficiario y teléfono son obligatorios.' });
      const phone = normalizePhone(req.body.telefono);
      if (phone === false) return res.status(400).json({ message: 'El teléfono debe contener entre 8 y 15 dígitos y solo puede usar números, +, espacios, guiones o paréntesis.' });
      req.body.telefono = phone;
      const idContactoBeneficiario = await Model.create(req.body);
      return res.status(201).json({ message: 'Contacto creado.', idContactoBeneficiario });
    } catch (error) { console.error(error); return res.status(400).json({ message: error.code === 'ER_DUP_ENTRY' ? 'El teléfono o contacto principal ya está registrado.' : error.message }); }
  }
  static async update(req, res) {
    try {
      const phone = normalizePhone(req.body.telefono);
      if (phone === false || phone === null) return res.status(400).json({ message: 'El teléfono debe contener entre 8 y 15 dígitos y solo puede usar números, +, espacios, guiones o paréntesis.' });
      req.body.telefono = phone;
      const changed = await Model.update(req.params.id, req.body);
      if (!changed) return res.status(404).json({ message: 'Contacto no encontrado o sin cambios.' });
      return res.json({ message: 'Contacto actualizado.' });
    } catch (error) { console.error(error); return res.status(400).json({ message: error.code === 'ER_DUP_ENTRY' ? 'El teléfono o contacto principal ya está registrado.' : error.message }); }
  }
}

module.exports = BeneficiarioContactoController;
