'use strict';
module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    isActive: { type: DataTypes.BOOLEAN, field: 'is_active', defaultValue: true }
  }, {
    tableName: 'roles',
    underscored: true,
    timestamps: true
  });

  Role.associate = function(models) {
    Role.belongsToMany(models.User, {
      through: models.UserRole,
      foreignKey: 'role_id',
      otherKey: 'user_id',
      as: 'Users'
    });
  };

  return Role;
};