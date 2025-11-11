const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Role = sequelize.define('Role', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, {
    tableName: 'roles',
    timestamps: true
  });

  Role.prototype.hasPermission = async function (permissionName) {
    const perms = await this.getPermissions({ where: { name: permissionName } });
    return perms && perms.length > 0;
  };

  Role.prototype.grantPermission = async function (permission) {
    await this.addPermission(permission);
  };

  Role.prototype.revokePermission = async function (permission) {
    await this.removePermission(permission);
  };

  return Role;
};