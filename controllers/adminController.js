const { User, Role } = require('../models');

/**
 * Simple admin handlers (rendering or API)
 */
exports.dashboard = async (req, res) => {
  // Example data: user count, ticket counts etc. Add as needed.
  const userCount = await User.count();
  return res.json({ success: true, message: 'Admin dashboard', data: { userCount } });
};

exports.listUsers = async (req, res) => {
  const users = await User.findAll({ include: [{ model: Role, as: 'Roles' }] });
  return res.json({ success: true, data: users });
};

exports.createUser = async (req, res) => {
  const { name, email, password, roles } = req.body;
  const user = await User.create({ name, email, password });
  if (roles && Array.isArray(roles)) {
    // roles can be role IDs or names - support names by finding them
    const roleObjs = await Role.findAll({ where: { name: roles } });
    await user.addRoles(roleObjs);
  }
  return res.status(201).json({ success: true, data: user });
};

exports.updateUser = async (req, res) => {
  const id = req.params.id;
  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  await user.update(req.body);
  if (req.body.roles) {
    const roleObjs = await Role.findAll({ where: { name: req.body.roles } });
    await user.setRoles(roleObjs);
  }
  return res.json({ success: true, data: user });
};

exports.deleteUser = async (req, res) => {
  const id = req.params.id;
  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  await user.destroy();
  return res.json({ success: true, message: 'User deleted' });
};

exports.listUsersForAdmin = exports.listUsers; // alias for API admin list
exports.createUserByAdmin = exports.createUser;