const { Permission } = require('../../models');

exports.index = async (req, res) => {
  try {
    const where = {};
    if (req.query.module) where.module = req.query.module;
    if (req.query.is_active !== undefined) where.is_active = req.query.is_active === 'true';

    const permissions = await Permission.findAll({ where });
    return res.json({ success: true, message: 'Permissions fetched successfully', data: permissions });
  } catch (err) {
    console.error('PermissionController.index', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch permissions', error: err.message });
  }
};

exports.store = async (req, res) => {
  try {
    const { name, description, module, is_active } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });

    const existing = await Permission.findOne({ where: { name } });
    if (existing) return res.status(400).json({ success: false, message: 'Permission already exists' });

    const permission = await Permission.create({
      name,
      description: description ?? null,
      module: module ?? null,
      is_active: is_active === undefined ? true : !!is_active,
    });

    return res.status(201).json({ success: true, message: 'Permission created successfully', data: permission });
  } catch (err) {
    console.error('PermissionController.store', err);
    return res.status(500).json({ success: false, message: 'Failed to create permission', error: err.message });
  }
};

exports.show = async (req, res) => {
  return res.json({ success: true, data: req.permission });
};

exports.update = async (req, res) => {
  try {
    const permission = req.permission;
    const { name, description, module, is_active } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name required' });

    await permission.update({
      name,
      description: description ?? permission.description,
      module,
      is_active: is_active === undefined ? permission.is_active : !!is_active,
    });

    return res.json({ success: true, message: 'Permission updated successfully', data: permission });
  } catch (err) {
    console.error('PermissionController.update', err);
    return res.status(500).json({ success: false, message: 'Failed to update permission', error: err.message });
  }
};

exports.destroy = async (req, res) => {
  try {
    await req.permission.destroy();
    return res.json({ success: true, message: 'Permission deleted successfully' });
  } catch (err) {
    console.error('PermissionController.destroy', err);
    return res.status(500).json({ success: false, message: 'Failed to delete permission', error: err.message });
  }
};

exports.byModule = async (req, res) => {
  try {
    const permissions = await Permission.findAll({ where: { is_active: true } });
    const grouped = permissions.reduce((acc, p) => {
      const key = p.module || 'general';
      acc[key] = acc[key] || [];
      acc[key].push(p);
      return acc;
    }, {});
    return res.json({ success: true, data: grouped });
  } catch (err) {
    console.error('PermissionController.byModule', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch permissions by module', error: err.message });
  }
};