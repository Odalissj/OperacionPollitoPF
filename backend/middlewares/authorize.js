function requireRole(...allowedRoleIds) {
  const allowed = new Set(allowedRoleIds.map(Number));

  return (req, res, next) => {
    const roleId = Number(req.user?.idRol);
    if (!allowed.has(roleId)) {
      return res.status(403).json({
        message: 'No tienes permisos para realizar esta operación.',
      });
    }
    return next();
  };
}

const requireAdmin = requireRole(1);

module.exports = { requireRole, requireAdmin };
