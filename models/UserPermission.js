const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('UserPermission', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.STRING },
    permission_id: { type: DataTypes.BIGINT }
  }, {
    tableName: 'user_permissions',
    timestamps: true
  });
};