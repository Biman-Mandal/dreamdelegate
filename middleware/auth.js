const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Unauthenticated. Please provide a valid token.' });
  const parts = header.split(' ');
  if (parts.length !== 2) return res.status(401).json({ message: 'Invalid token format' });
  const token = parts[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(401).json({ message: 'Unauthenticated. Please provide a valid token.' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthenticated. Please provide a valid token.' });
  }
};