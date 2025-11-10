/**
 * middleware/auth.js
 * JWT auth middleware that works for both API and admin routes.
 * Attaches req.user (Sequelize User instance).
 */
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.cookies?.auth_token;
    if (!authHeader) return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });

    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(payload.sub, {
      include: [{ model: Role, as: 'Roles' }]
    });
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized: User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized: ' + (err.message || 'Invalid token') });
  }
}

module.exports = { authMiddleware };