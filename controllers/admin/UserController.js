const { User, Role, Permission } = require('../../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

exports.index = async (req, res) => {
  try {
    const roleFilter = req.query.role;
    const where = {};
    const include = [{ model: require('../../models').Role, as: 'Roles' }, { model: require('../../models').Permission, as: 'Permissions', through: { attributes: [] }, required: false }];

    if (roleFilter) {
      // eager load via include and where on Role
      const users = await User.findAll({
        include: [{
          model: Role,
          where: { name: roleFilter },
          required: true,
        }, { model: Permission, required: false }],
        order: [['createdAt', 'DESC']],
      });
      return res.json({ success: true, data: users });
    }

    const users = await User.findAll({ include, order: [['createdAt', 'DESC']] });
    const roles = await Role.findAll();
    return res.json({ success: true, data: { users, roles } });
  } catch (e) {
    console.error('Admin UserController.index', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch users', error: e.message });
  }
};

exports.store = async (req, res) => {
  try {
    const { name, email, phone, password, password_confirmation, roles } = req.body;
    if (!name || !email || !password || password !== password_confirmation) return res.status(400).json({ success: false, message: 'Validation failed' });

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });

    const user = await User.create({
      name,
      email,
      phone: phone ?? null,
      password,
    });

    if (Array.isArray(roles) && roles.length) {
      const roleRecords = await Role.findAll({ where: { id: roles } });
      await user.setRoles(roleRecords);
    }

    const result = await User.findByPk(user.id, { include: ['Roles', 'Permissions'] });
    return res.status(201).json({ success: true, message: 'User created successfully', data: result });
  } catch (e) {
    console.error('Admin UserController.store', e);
    return res.status(500).json({ success: false, message: 'Failed to create user', error: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { name, email, phone, password, password_confirmation, roles } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: 'name and email required' });
    if (password && password !== password_confirmation) return res.status(400).json({ success: false, message: 'Password confirmation mismatch' });

    await user.update({
      name,
      email,
      phone: phone ?? user.phone,
      ...(password ? { password } : {}),
    });

    if (Array.isArray(roles)) {
      const roleRecords = await Role.findAll({ where: { id: roles } });
      await user.setRoles(roleRecords);
    }

    const result = await User.findByPk(user.id, { include: ['Roles', 'Permissions'] });
    return res.json({ success: true, message: 'User updated successfully', data: result });
  } catch (e) {
    console.error('Admin UserController.update', e);
    return res.status(500).json({ success: false, message: 'Failed to update user', error: e.message });
  }
};

exports.destroy = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await user.destroy();
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (e) {
    console.error('Admin UserController.destroy', e);
    return res.status(500).json({ success: false, message: 'Failed to delete user', error: e.message });
  }
};

exports.assignRole = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    const { role_id } = req.body;
    const role = await Role.findByPk(role_id);
    if (!user || !role) return res.status(404).json({ success: false, message: 'User or role not found' });

    await user.addRole(role);
    const result = await User.findByPk(user.id, { include: ['Roles', 'Permissions'] });
    return res.json({ success: true, message: 'Role assigned to user successfully', data: result });
  } catch (e) {
    console.error('Admin UserController.assignRole', e);
    return res.status(500).json({ success: false, message: 'Failed to assign role', error: e.message });
  }
};

exports.removeRole = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    const { role_id } = req.body;
    const role = await Role.findByPk(role_id);
    if (!user || !role) return res.status(404).json({ success: false, message: 'User or role not found' });

    await user.removeRole(role);
    const result = await User.findByPk(user.id, { include: ['Roles', 'Permissions'] });
    return res.json({ success: true, message: 'Role removed from user successfully', data: result });
  } catch (e) {
    console.error('Admin UserController.removeRole', e);
    return res.status(500).json({ success: false, message: 'Failed to remove role', error: e.message });
  }
};