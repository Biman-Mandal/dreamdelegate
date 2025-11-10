const { Permission } = require('../../models');

exports.index = async (req, res) => {
  const permissions = await Permission.findAll();
  return res.json({ success: true, data: permissions });
};

exports.create = async (req, res) => {
  return res.json({ success: true, message: 'Render create permission view (or use API)' });
};

exports.store = async (req, res) => {
  const { name, description, module } = req.body;
  const permission = await Permission.create({ name, description, module });
  return res.status(201).json({ success: true, data: permission });
};

exports.show = async (req, res) => {
  const permission = await Permission.findByPk(req.params.id);
  if (!permission) return res.status(404).json({ success: false, message: 'Permission not found' });
  return res.json({ success: true, data: permission });
};

exports.update = async (req, res) => {
  const permission = await Permission.findByPk(req.params.id);
  if (!permission) return res.status(404).json({ success: false, message: 'Permission not found' });
  await permission.update(req.body);
  return res.json({ success: true, data: permission });
};

exports.destroy = async (req, res) => {
  const permission = await Permission.findByPk(req.params.id);
  if (!permission) return res.status(404).json({ success: false, message: 'Permission not found' });
  await permission.destroy();
  return res.json({ success: true, message: 'Permission deleted successfully' });
};

exports.byModule = async (req, res) => {
  const list = await Permission.findAll();
  const grouped = list.reduce((acc, p) => {
    acc[p.module || 'general'] = acc[p.module || 'general'] || [];
    acc[p.module || 'general'].push(p);
    return acc;
  }, {});
  return res.json({ success: true, data: grouped });
};