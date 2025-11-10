const { User, Role } = require('../models');

/**
 * Endpoints used under /api/admin/* in the API group (example).
 * These are admin API endpoints (protected by checkRole('admin') in routes/api.js).
 */
exports.listUsersForAdmin = async (req, res) => {
  const users = await User.findAll({ include: [{ model: Role, as: 'Roles' }] });
  return res.json({ success: true, data: users });
};

exports.createUserByAdmin = async (req, res) => {
  const { name, email, password, roles } = req.body;
  const user = await User.create({ name, email, password });
  if (roles && roles.length) {
    const roleObjs = await Role.findAll({ where: { name: roles } });
    await user.addRoles(roleObjs);
  }
  return res.status(201).json({ success: true, data: user });
};