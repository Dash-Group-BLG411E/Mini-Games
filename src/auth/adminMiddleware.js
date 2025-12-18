const { requireAuth } = require('./authMiddleware');

/**
 * Middleware to require admin role
 * Must be used after requireAuth
 */
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.role) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

module.exports = {
  requireAdmin
};

