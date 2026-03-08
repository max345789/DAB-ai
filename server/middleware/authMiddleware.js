// middleware/authMiddleware.js — DAB AI v5.0
// JWT verification middleware

const jwt = require('jsonwebtoken');
const logger = require('../services/loggerService');

const JWT_SECRET = process.env.JWT_SECRET || 'dab-ai-secret-change-in-prod';

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, email, role }
    next();
  } catch (err) {
    logger.warn('AUTH', 'Invalid token', { error: err.message });
    return res.status(401).json({ error: 'Token expired or invalid' });
  }
}

// Optional auth — attaches user if token present, but does not block
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.slice(7), JWT_SECRET);
    } catch (_) {}
  }
  next();
}

// Role guard factory
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Role '${req.user.role}' not permitted` });
    }
    next();
  };
}

module.exports = { authMiddleware, optionalAuth, requireRole };
