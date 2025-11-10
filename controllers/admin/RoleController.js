const { Role, Permission } = require('../../models');

exports.index = async (req, res) => {
  const roles = await Role.findAll({ include: [{ model: Permission, as: 'Permissions' }] });
  return res.json({ success: true, data: roles });
};

exports.store = async (req, res) => {
  const { name, description } = req.body;
  const role = await Role.create({ name, description, is_active: true });
  return res.status(201).json({ success: true, data: role });
};

exports.show = async (req, res) => {
  const role = await Role.findByPk(req.params.id, { include: [{ model: Permission, as: 'Permissions' }] });
  if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
  return res.json({ success: true, data: role });
};

exports.update = async (req, res) => {
  const role = await Role.findByPk(req.params.id);
  if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
  await role.update(req.body);
  return res.json({ success: true, data: role });
};

exports.destroy = async (req, res) => {
  const role = await Role.findByPk(req.params.id);
  if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
  await role.destroy();
  return res.json({ success: true, message: 'Role deleted successfully' });
};

exports.assignPermission = async (req, res) => {
  const role = await Role.findByPk(req.params.id);
  if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
  const permission = await Permission.findByPk(req.body.permission_id);
  if (!permission) return res.status(404).json({ success: false, message: 'Permission not found' });
  await role.addPermission(permission);
  return res.json({ success: true, message: 'Permission assigned successfully' });
};

exports.revokePermission = async (req, res) => {
  const role = await Role.findByPk(req.params.id);
  if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
  const permission = await Permission.findByPk(req.body.permission_id);
  if (!permission) return res.status(404).json({ success: false, message: 'Permission not found' });
  await role.removePermission(permission);
  return res.json({ success: true, message: 'Permission revoked successfully' });
};