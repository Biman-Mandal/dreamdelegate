const { DataTypes } = require('sequelize');
const moment = require('moment');

module.exports = (sequelize) => {
  const Slot = sequelize.define('Slot', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    day_of_week: { type: DataTypes.ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') },
    start_time: { type: DataTypes.TIME },
    end_time: { type: DataTypes.TIME },
    start_date: { type: DataTypes.DATEONLY },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    max_bookings: { type: DataTypes.INTEGER, defaultValue: 1 },
    current_bookings: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    description: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'slots',
    timestamps: true
  });

  Slot.prototype.isAvailableForDate = async function (date) {
    if (!this.is_active) return false;
    const dateStr = moment(date).format('YYYY-MM-DD');
    if (dateStr < moment(this.start_date).format('YYYY-MM-DD')) return false;
    if (this.end_date && dateStr > moment(this.end_date).format('YYYY-MM-DD')) return false;
    const dayName = moment(date).format('dddd');
    if (dayName !== this.day_of_week) return false;
    const bookings = await this.countSlotBookings({ where: { booked_date: dateStr, status: 'confirmed' } });
    return bookings < this.max_bookings;
  };

  Slot.getAvailableSlotsForDateRange = async function (startDate, endDate) {
    const slots = await Slot.findAll({ where: { is_active: true } });
    const results = [];
    const start = moment(startDate);
    const end = moment(endDate);
    let current = start.clone();
    while (current <= end) {
      for (const s of slots) {
        if (await s.isAvailableForDate(current)) {
          results.push({
            slot_id: s.id,
            date: current.format('YYYY-MM-DD'),
            day: current.format('dddd'),
            start_time: s.start_time,
            end_time: s.end_time,
            description: s.description
          });
        }
      }
      current.add(1, 'day');
    }
    return results;
  };

  return Slot;
};