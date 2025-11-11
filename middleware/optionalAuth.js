const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return next();
  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    const user = await User.findByPk(payload.id);
    if (user) req.user = user;
  } catch (e) {
    // ignore and continue as guest
  }
  next();
};