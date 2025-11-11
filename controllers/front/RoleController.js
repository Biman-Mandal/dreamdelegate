const { Role, Permission } = require('../../models');

exports.index = async (req, res) => {
  try {
    const roles = await Role.findAll({ include: [{ model: Permission }] });
    return res.json({ success: true, message: 'Roles fetched successfully', data: roles });
  } catch (err) {
    console.error('RoleController.index', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch roles', error: err.message });
  }
};

exports.store = async (req, res) => {
  try {
    const { name, description, is_active, permissions } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name required' });

    const role = await Role.create({ name, description: description ?? null, is_active: is_active === undefined ? true : !!is_active });
    if (Array.isArray(permissions) && permissions.length) await role.setPermissions(permissions);
    await role.reload({ include: [{ model: Permission }] });

    return res.status(201).json({ success: true, message: 'Role created successfully', data: role });
  } catch (err) {
    console.error('RoleController.store', err);
    return res.status(500).json({ success: false, message: 'Failed to create role', error: err.message });
  }
};

exports.show = async (req, res) => {
  return res.json({ success: true, data: await req.role.reload({ include: [{ model: Permission }] }) });
};

exports.update = async (req, res) => {
  try {
    const { name, description, is_active, permissions } = req.body;
    const role = req.role;
    if (!name) return res.status(400).json({ success: false, message: 'name required' });

    await role.update({ name, description: description ?? role.description, is_active: is_active === undefined ? role.is_active : !!is_active });
    if (Array.isArray(permissions)) await role.setPermissions(permissions);
    await role.reload({ include: [{ model: Permission }] });

    return res.json({ success: true, message: 'Role updated successfully', data: role });
  } catch (err) {
    console.error('RoleController.update', err);
    return res.status(500).json({ success: false, message: 'Failed to update role', error: err.message });
  }
};

exports.destroy = async (req, res) => {
  try {
    await req.role.destroy();
    return res.json({ success: true, message: 'Role deleted successfully' });
  } catch (err) {
    console.error('RoleController.destroy', err);
    return res.status(500).json({ success: false, message: 'Failed to delete role', error: err.message });
  }
};