const { User, Role, Permission } = require('../../models');
const bcrypt = require('bcryptjs');

exports.index = async (req, res) => {
  try {
    const users = await User.findAll({ include: ['Roles', 'Permissions'] });
    return res.json({ success: true, message: 'Users fetched successfully', data: users });
  } catch (err) {
    console.error('UserController.index', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch users', error: err.message });
  }
};

exports.store = async (req, res) => {
  try {
    const { name, email, password, password_confirmation, phone, roles } = req.body;
    if (!name || !email || !password || password !== password_confirmation) {
      return res.status(400).json({ success: false, message: 'Validation failed' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'Email already used' });

    const user = await User.create({ name, email, password, phone: phone ?? null });

    if (Array.isArray(roles) && roles.length) {
      const roleRecords = await Role.findAll({ where: { id: roles } });
      await user.setRoles(roleRecords);
    }

    return res.status(201).json({ success: true, message: 'User created successfully', data: await user.reload({ include: ['Roles', 'Permissions'] }) });
  } catch (err) {
    console.error('UserController.store', err);
    return res.status(500).json({ success: false, message: 'Failed to create user', error: err.message });
  }
};

exports.show = async (req, res) => {
  return res.json({ success: true, data: await req.userRecord.reload({ include: ['Roles', 'Permissions'] }) });
};

exports.update = async (req, res) => {
  try {
    const user = req.userRecord;
    const { name, email, phone } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: 'name and email required' });

    const existing = await User.findOne({ where: { email, id: { $ne: user.id } } });
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });

    await user.update({ name, email, phone: phone ?? user.phone });

    return res.json({ success: true, message: 'User updated successfully', data: await user.reload({ include: ['Roles','Permissions'] }) });
  } catch (err) {
    console.error('UserController.update', err);
    return res.status(500).json({ success: false, message: 'Failed to update user', error: err.message });
  }
};

exports.destroy = async (req, res) => {
  try {
    await req.userRecord.destroy();
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('UserController.destroy', err);
    return res.status(500).json({ success: false, message: 'Failed to delete user', error: err.message });
  }
};

exports.assignRole = async (req, res) => {
  try {
    const role = await Role.findByPk(req.body.role_id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    await req.userRecord.addRole(role);
    return res.json({ success: true, message: 'Role assigned to user successfully', data: await req.userRecord.reload({ include: ['Roles','Permissions'] }) });
  } catch (err) {
    console.error('UserController.assignRole', err);
    return res.status(500).json({ success: false, message: 'Failed to assign role', error: err.message });
  }
};

exports.removeRole = async (req, res) => {
  try {
    const role = await Role.findByPk(req.body.role_id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    await req.userRecord.removeRole(role);
    return res.json({ success: true, message: 'Role removed from user successfully', data: await req.userRecord.reload({ include: ['Roles','Permissions'] }) });
  } catch (err) {
    console.error('UserController.removeRole', err);
    return res.status(500).json({ success: false, message: 'Failed to remove role', error: err.message });
  }
};

exports.grantPermission = async (req, res) => {
  try {
    const permission = await Permission.findByPk(req.body.permission_id);
    if (!permission) return res.status(404).json({ success: false, message: 'Permission not found' });
    await req.userRecord.addPermission(permission);
    return res.json({ success: true, message: 'Permission granted to user successfully', data: await req.userRecord.reload({ include: ['Roles','Permissions'] }) });
  } catch (err) {
    console.error('UserController.grantPermission', err);
    return res.status(500).json({ success: false, message: 'Failed to grant permission', error: err.message });
  }
};

exports.revokePermission = async (req, res) => {
  try {
    const permission = await Permission.findByPk(req.body.permission_id);
    if (!permission) return res.status(404).json({ success: false, message: 'Permission not found' });
    await req.userRecord.removePermission(permission);
    return res.json({ success: true, message: 'Permission revoked from user successfully', data: await req.userRecord.reload({ include: ['Roles','Permissions'] }) });
  } catch (err) {
    console.error('UserController.revokePermission', err);
    return res.status(500).json({ success: false, message: 'Failed to revoke permission', error: err.message });
  }
};