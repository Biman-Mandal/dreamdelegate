const { Permission } = require('../../models');
const { Op } = require('sequelize');

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 20;
    const where = {};
    if (req.query.module) where.module = req.query.module;
    if (req.query.is_active !== undefined) where.is_active = req.query.is_active === 'true';

    const { rows, count } = await Permission.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      message: 'Permissions fetched successfully',
      data: {
        items: rows,
      },
    });
  } catch (e) {
    console.error('PermissionController.index', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch permissions', error: e.message });
  }
};

exports.formData = async (req, res) => {
  try {
    const modules = await Permission.findAll({ attributes: ['module'], group: ['module'], order: [['module', 'ASC']] });
    const moduleList = modules.map(m => m.module).filter(Boolean);
    return res.json({ success: true, data: { modules: moduleList } });
  } catch (e) {
    console.error('PermissionController.formData', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch form data', error: e.message });
  }
};

exports.store = async (req, res) => {
  try {
    const { name, description, module, is_active } = req.body;
    if (!name || !module) return res.status(400).json({ success: false, message: 'name and module are required' });

    const existing = await Permission.findOne({ where: { name } });
    if (existing) return res.status(400).json({ success: false, message: 'Permission name already exists' });

    const permission = await Permission.create({
      name,
      description: description ?? null,
      module,
      is_active: is_active === undefined ? true : !!is_active,
    });

    return res.status(201).json({ success: true, message: 'Permission created successfully', data: permission });
  } catch (e) {
    console.error('PermissionController.store', e);
    return res.status(500).json({ success: false, message: 'Failed to create permission', error: e.message });
  }
};

exports.show = async (req, res) => {
  try {
    const permission = req.permission; // set by route param loader
    return res.json({ success: true, data: permission });
  } catch (e) {
    console.error('PermissionController.show', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch permission', error: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const permission = req.permission;
    const { name, description, module, is_active } = req.body;
    if (!name || !module) return res.status(400).json({ success: false, message: 'name and module are required' });

    // check uniqueness excluding current id
    const exist = await Permission.findOne({ where: { name, id: { [Op.ne]: permission.id } } });
    if (exist) return res.status(400).json({ success: false, message: 'Permission name already used by another permission' });

    await permission.update({
      name,
      description: description ?? permission.description,
      module,
      is_active: is_active === undefined ? permission.is_active : !!is_active,
    });

    return res.json({ success: true, message: 'Permission updated successfully', data: permission });
  } catch (e) {
    console.error('PermissionController.update', e);
    return res.status(500).json({ success: false, message: 'Failed to update permission', error: e.message });
  }
};

exports.destroy = async (req, res) => {
  try {
    const permission = req.permission;
    // check associations (if your models provide roles/users relations, adjust accordingly)
    // For simplicity, attempt to destroy and catch FK constraints
    await permission.destroy();
    return res.json({ success: true, message: 'Permission deleted successfully' });
  } catch (e) {
    console.error('PermissionController.destroy', e);
    return res.status(500).json({ success: false, message: 'Failed to delete permission', error: e.message });
  }
};

exports.byModule = async (req, res) => {
  try {
    const permissions = await Permission.findAll({ where: { is_active: true }, order: [['module', 'ASC']] });
    const grouped = permissions.reduce((acc, p) => {
      const key = p.module || 'general';
      acc[key] = acc[key] || [];
      acc[key].push(p);
      return acc;
    }, {});
    return res.json({ success: true, data: grouped });
  } catch (e) {
    console.error('PermissionController.byModule', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch permissions by module', error: e.message });
  }
};