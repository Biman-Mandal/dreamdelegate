const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SlotBooking = sequelize.define('SlotBooking', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    slot_id: { type: DataTypes.BIGINT },
    user_id: { type: DataTypes.STRING },
    booked_date: { type: DataTypes.DATE },
    status: { type: DataTypes.ENUM('confirmed','cancelled','completed'), defaultValue: 'confirmed' },
    notes: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'slot_bookings',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['slot_id', 'user_id', 'booked_date'] }
    ]
  });

  return SlotBooking;
};