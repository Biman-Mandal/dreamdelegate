const { User, Role } = require('../../models');

exports.dashboard = async (req, res) => {
  const userCount = await User.count();
  return res.json({ success: true, message: 'Admin dashboard', data: { userCount } });
};

exports.listUsers = async (req, res) => {
  const users = await User.findAll({ include: [{ model: Role, as: 'Roles' }] });
  return res.json({ success: true, data: users });
};

exports.createUser = async (req, res) => {
  console.log(" im here")
  const { name, email, password, roles } = req.body;
  const user = await User.create({ name, email, password });
  if (roles && roles.length) {
    const roleObjs = await Role.findAll({ where: { name: roles } });
    await user.addRoles(roleObjs);
  }
  return res.status(201).json({ success: true, data: user });
};

exports.getUser = async (req, res) => {
  const user = await User.findByPk(req.params.id, { include: [{ model: Role, as: 'Roles' }] });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  return res.json({ success: true, data: user });
};

exports.updateUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  await user.update(req.body);
  if (req.body.roles) {
    const roleObjs = await Role.findAll({ where: { name: req.body.roles } });
    await user.setRoles(roleObjs);
  }
  return res.json({ success: true, data: user });
};

exports.deleteUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  await user.destroy();
  return res.json({ success: true, message: 'User deleted' });
};

exports.assignRole = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  const role = await Role.findByPk(req.body.role_id);
  if (!user || !role) return res.status(404).json({ success: false, message: 'Not found' });
  await user.addRole(role);
  return res.json({ success: true, message: 'Role assigned' });
};

exports.removeRole = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  const role = await Role.findByPk(req.body.role_id);
  if (!user || !role) return res.status(404).json({ success: false, message: 'Not found' });
  await user.removeRole(role);
  return res.json({ success: true, message: 'Role removed' });
};