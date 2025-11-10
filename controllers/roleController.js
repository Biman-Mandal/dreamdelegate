const { Role } = require('../models');

exports.index = async (req, res) => {
  const roles = await Role.findAll();
  return res.json({ success: true, data: roles });
};

exports.store = async (req, res) => {
  const { name, description } = req.body;
  const role = await Role.create({ name, description });
  return res.status(201).json({ success: true, data: role });
};

exports.update = async (req, res) => {
  const id = req.params.id;
  const role = await Role.findByPk(id);
  if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
  await role.update(req.body);
  return res.json({ success: true, data: role });
};

exports.destroy = async (req, res) => {
  const role = await Role.findByPk(req.params.id);
  if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
  await role.destroy();
  return res.json({ success: true, message: 'Role deleted' });
};