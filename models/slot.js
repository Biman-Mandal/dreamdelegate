'use strict';
/**
 * Sequelize Slot model
 * Matches earlier migrations: day_of_week, start_time, end_time, start_date, end_date, max_bookings, current_bookings, is_active, description
 */
module.exports = (sequelize, DataTypes) => {
  const Slot = sequelize.define('Slot', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    day_of_week: { type: DataTypes.ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), allowNull: false },
    start_time: { type: DataTypes.TIME, allowNull: false },
    end_time: { type: DataTypes.TIME, allowNull: false },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    max_bookings: { type: DataTypes.INTEGER, defaultValue: 1 },
    current_bookings: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    description: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'slots',
    underscored: true,
    timestamps: true
  });

  Slot.associate = function(models) {
    Slot.hasMany(models.SlotBooking, { foreignKey: 'slot_id', as: 'bookings' });
  };

  return Slot;
};