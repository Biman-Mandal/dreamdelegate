'use strict';
/**
 * Sequelize SlotBooking model
 * Columns: slot_id, user_id, booked_date (datetime), status, notes
 */
module.exports = (sequelize, DataTypes) => {
  const SlotBooking = sequelize.define('SlotBooking', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    slot_id: { type: DataTypes.INTEGER },
    user_id: { type: DataTypes.INTEGER },
    booked_date: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.ENUM('confirmed','cancelled','completed'), defaultValue: 'confirmed' },
    notes: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'slot_bookings',
    underscored: true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ['slot_id', 'user_id', 'booked_date'], name: 'slot_bookings_slot_user_date_unique' }
    ]
  });

  SlotBooking.associate = function(models) {
    SlotBooking.belongsTo(models.Slot, { foreignKey: 'slot_id', as: 'Slot' });
    SlotBooking.belongsTo(models.User, { foreignKey: 'user_id', as: 'User' });
  };

  return SlotBooking;
};