function enforceReadOnlyRole(req, res, next) {
  const isReadOnly = Number(req.user?.idRol) === 3;
  const isReadMethod = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (isReadOnly && !isReadMethod) {
    return res.status(403).json({ message: 'Tu usuario tiene permisos únicamente de consulta.' });
  }
  return next();
}

module.exports = enforceReadOnlyRole;
