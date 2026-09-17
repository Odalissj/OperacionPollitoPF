const jwt = require('jsonwebtoken');

const publicPaths = new Set(['/auth/login', '/auth/forgot-password', '/auth/reset-password', '/health']);

function authenticate(req, res, next) {
  if (publicPaths.has(req.path)) return next();

  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Se requiere un token de acceso.' });
  }

  try {
    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET || 'mi_secreto_super_seguro_e_irrepetible'
    );
    return next();
  } catch (error) {
    const message = error.name === 'TokenExpiredError'
      ? 'La sesión expiró. Inicia sesión nuevamente.'
      : 'El token de acceso no es válido.';
    return res.status(401).json({ message });
  }
}

module.exports = authenticate;
