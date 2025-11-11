const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('RolePermission', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    role_id: { type: DataTypes.BIGINT },
    permission_id: { type: DataTypes.BIGINT }
  }, {
    tableName: 'role_permissions',
    timestamps: true
  });
};