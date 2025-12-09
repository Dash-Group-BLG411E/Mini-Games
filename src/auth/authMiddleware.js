const { verifyToken } = require('./authUtils')

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '')
    : null

  if (!token) {
    return res.status(401).json({ error: 'Authentication token is missing' })
  }

  try {
    const payload = verifyToken(token)
    req.user = payload
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (roles.length === 0 || roles.includes(req.user.role)) {
      return next()
    }

    return res.status(403).json({ error: 'Insufficient role' })
  }
}

module.exports = {
  requireAuth,
  requireRole
}

