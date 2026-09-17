const express = require('express');
const ConfiguracionController = require('../controllers/configuracionController');
const { requireAdmin } = require('../middlewares/authorize');
const router = express.Router();

router.get('/configuracion/meta-donaciones', ConfiguracionController.getMeta);
router.put('/configuracion/meta-donaciones', requireAdmin, ConfiguracionController.updateMeta);

module.exports = router;
