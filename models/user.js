const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const cuid = require('cuid');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.STRING, primaryKey: true },
    name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: true },
    avatarUrl: { type: DataTypes.STRING, allowNull: true },
    // quick role enum column in user, in addition to the roles pivot table if used.
    role: { type: DataTypes.ENUM('owner', 'staff', 'client'), allowNull: false, defaultValue: 'client' },
    status: { type: DataTypes.ENUM('active', 'invited', 'disabled'), allowNull: false, defaultValue: 'active' },
    password: { type: DataTypes.STRING },
    email_verified_at: { type: DataTypes.DATE, allowNull: true },
    lastLoginAt: { type: DataTypes.DATE, allowNull: true },
    mfa_enabled: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: false
  });

  // Generate CUID for primary key if not provided
  User.beforeCreate(async (user, options) => {
    if (!user.id) user.id = cuid();
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  });

  User.beforeUpdate(async (user, options) => {
    if (user.changed('password')) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  });

  // Relationship helpers will be attached in models/index.js

  // Role/permission helper methods (useful wrappers)
  User.prototype.hasRole = async function (roles) {
    if (!roles) return false;
    const { Role } = sequelize.models;
    if (typeof roles === 'string') roles = [roles];
    const r = await this.getRoles({ where: { name: roles } });
    return r && r.length > 0;
  };

  User.prototype.hasPermission = async function (permissionName) {
    const perms = await this.getPermissions({ where: { name: permissionName } });
    if (perms && perms.length > 0) return true;
    const roles = await this.getRoles({ include: [{ model: sequelize.models.Permission, where: { name: permissionName }, required: false }] });
    for (const r of roles) {
      const p = await r.getPermissions({ where: { name: permissionName } });
      if (p && p.length > 0) return true;
    }
    return false;
  };

  User.prototype.hasAnyPermission = async function (permissions) {
    for (const p of permissions) {
      if (await this.hasPermission(p)) return true;
    }
    return false;
  };

  User.prototype.hasAllPermissions = async function (permissions) {
    for (const p of permissions) {
      if (!(await this.hasPermission(p))) return false;
    }
    return true;
  };

  User.prototype.assignRole = async function (roleOrName) {
    const { Role } = sequelize.models;
    let role = roleOrName;
    if (typeof roleOrName === 'string') {
      role = await Role.findOne({ where: { name: roleOrName } });
      if (!role) throw new Error('Role not found: ' + roleOrName);
    }
    await this.addRole(role);
  };

  User.prototype.removeRole = async function (roleOrName) {
    const { Role } = sequelize.models;
    let role = roleOrName;
    if (typeof roleOrName === 'string') {
      role = await Role.findOne({ where: { name: roleOrName } });
      if (!role) return;
    }
    await this.removeRole(role);
  };

  User.prototype.grantPermission = async function (permissionOrName) {
    const { Permission } = sequelize.models;
    let permission = permissionOrName;
    if (typeof permissionOrName === 'string') {
      permission = await Permission.findOne({ where: { name: permissionOrName } });
      if (!permission) throw new Error('Permission not found: ' + permissionOrName);
    }
    await this.addPermission(permission);
  };

  User.prototype.revokePermission = async function (permissionOrName) {
    const { Permission } = sequelize.models;
    let permission = permissionOrName;
    if (typeof permissionOrName === 'string') {
      permission = await Permission.findOne({ where: { name: permissionOrName } });
      if (!permission) return;
    }
    await this.removePermission(permission);
  };

  return User;
};