'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserRole = sequelize.define('UserRole', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, field: 'user_id' },
    roleId: { type: DataTypes.INTEGER, field: 'role_id' }
  }, {
    tableName: 'user_roles',
    underscored: true,
    timestamps: true
  });
  return UserRole;
};