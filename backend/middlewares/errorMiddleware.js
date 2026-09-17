function errorHandler(error, _req, res, _next) {
  console.error('Error no controlado:', error);
  if (res.headersSent) return;
  res.status(error.status || 500).json({
    message: error.status ? error.message : 'Error interno del servidor.',
  });
}

module.exports = errorHandler;
