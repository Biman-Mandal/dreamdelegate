const { Role, Permission } = require('../../models');
const { Op } = require('sequelize');

exports.index = async (req, res) => {
  try {
    const roles = await Role.findAll({ include: [{ model: Permission }] });
    return res.json({ success: true, message: 'Roles fetched successfully', data: roles });
  } catch (e) {
    console.error('RoleController.index', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch roles', error: e.message });
  }
};

exports.formData = async (req, res) => {
  try {
    const permissions = await Permission.findAll();
    const grouped = permissions.reduce((acc, p) => {
      const key = p.module || 'general';
      acc[key] = acc[key] || [];
      acc[key].push(p);
      return acc;
    }, {});
    return res.json({ success: true, data: { permissions: grouped } });
  } catch (e) {
    console.error('RoleController.formData', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch role form data', error: e.message });
  }
};

exports.store = async (req, res) => {
  try {
    const { name, description, is_active, permissions } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });

    const exist = await Role.findOne({ where: { name } });
    if (exist) return res.status(400).json({ success: false, message: 'Role name already exists' });

    const role = await Role.create({ name, description: description ?? null, is_active: is_active === undefined ? true : !!is_active });
    if (Array.isArray(permissions) && permissions.length) {
      await role.setPermissions(permissions);
    }

    await role.reload({ include: [{ model: Permission }] });

    return res.status(201).json({ success: true, message: 'Role created successfully', data: role });
  } catch (e) {
    console.error('RoleController.store', e);
    return res.status(500).json({ success: false, message: 'Failed to create role', error: e.message });
  }
};

exports.show = async (req, res) => {
  try {
    const role = await req.role.reload({ include: [{ model: Permission }] });
    return res.json({ success: true, data: role });
  } catch (e) {
    console.error('RoleController.show', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch role', error: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const role = req.role;
    const { name, description, is_active, permissions } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });

    const exists = await Role.findOne({ where: { name, id: { [Op.ne]: role.id } } });
    if (exists) return res.status(400).json({ success: false, message: 'Another role with this name exists' });

    await role.update({ name, description: description ?? role.description, is_active: is_active === undefined ? role.is_active : !!is_active });

    if (Array.isArray(permissions)) {
      await role.setPermissions(permissions);
    }

    await role.reload({ include: [{ model: Permission }] });
    return res.json({ success: true, message: 'Role updated successfully', data: role });
  } catch (e) {
    console.error('RoleController.update', e);
    return res.status(500).json({ success: false, message: 'Failed to update role', error: e.message });
  }
};

exports.destroy = async (req, res) => {
  try {
    const role = req.role;
    await role.destroy();
    return res.json({ success: true, message: 'Role deleted successfully' });
  } catch (e) {
    console.error('RoleController.destroy', e);
    return res.status(500).json({ success: false, message: 'Failed to delete role', error: e.message });
  }
};

exports.assignPermission = async (req, res) => {
  try {
    const role = req.role;
    const { permission_id } = req.body;
    const permission = await Permission.findByPk(permission_id);
    if (!permission) return res.status(404).json({ success: false, message: 'Permission not found' });

    await role.addPermission(permission);
    await role.reload({ include: [{ model: Permission }] });

    return res.json({ success: true, message: 'Permission assigned to role successfully', data: role });
  } catch (e) {
    console.error('RoleController.assignPermission', e);
    return res.status(500).json({ success: false, message: 'Failed to assign permission', error: e.message });
  }
};

exports.revokePermission = async (req, res) => {
  try {
    const role = req.role;
    const { permission_id } = req.body;
    const permission = await Permission.findByPk(permission_id);
    if (!permission) return res.status(404).json({ success: false, message: 'Permission not found' });

    await role.removePermission(permission);
    await role.reload({ include: [{ model: Permission }] });

    return res.json({ success: true, message: 'Permission removed from role successfully', data: role });
  } catch (e) {
    console.error('RoleController.revokePermission', e);
    return res.status(500).json({ success: false, message: 'Failed to revoke permission', error: e.message });
  }
};