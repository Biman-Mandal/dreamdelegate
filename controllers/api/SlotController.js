const { Op } = require('sequelize');
const { Slot, SlotBooking } = require('../../models');
const { parseISO, startOfDay } = require('date-fns');

module.exports = {
  async getAvailableSlots(req, res) {
    try {
      const { start_date, end_date } = req.query;
      if (!start_date || !end_date) return res.status(422).json({ success: false, message: 'start_date and end_date are required' });
      const slots = await Slot.findAll({
        where: {
          is_active: true,
          start_date: { [Op.lte]: end_date },
          [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: start_date } }]
        },
        order: [['day_of_week', 'ASC'], ['start_time', 'ASC']]
      });
      const results = [];
      let cursor = startOfDay(parseISO(start_date));
      const last = startOfDay(parseISO(end_date));
      while (cursor <= last) {
        const dayName = cursor.toLocaleString('en-US', { weekday: 'long' });
        const dateStr = cursor.toISOString().slice(0, 10);
        const daySlots = slots.filter(s => s.day_of_week === dayName);
        const mapped = await Promise.all(daySlots.map(async slot => {
          const bookedCount = await SlotBooking.count({
            where: {
              slot_id: slot.id,
              status: { [Op.in]: ['confirmed', 'completed'] },
              booked_date: { [Op.between]: [dateStr + ' 00:00:00', dateStr + ' 23:59:59'] }
            }
          });
          return {
            slot_id: slot.id,
            start_time: slot.start_time,
            end_time: slot.end_time,
            available_spots: Math.max(0, slot.max_bookings - bookedCount),
            description: slot.description
          };
        }));
        if (mapped.length) results.push({ date: dateStr, slots: mapped });
        cursor.setDate(cursor.getDate() + 1);
      }
      return res.status(200).json({ success: true, message: 'Available slots fetched successfully', data: results });
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Failed to fetch available slots: ' + e.message });
    }
  },

  async getSlotsByDay(req, res) {
    try {
      const { date } = req.query;
      if (!date) return res.status(422).json({ success: false, message: 'date is required' });
      const parsed = parseISO(date);
      const today = startOfDay(new Date());
      if (parsed < today) return res.status(422).json({ success: false, message: 'date must be today or later' });
      const dayName = parsed.toLocaleString('en-US', { weekday: 'long' });
      const slots = await Slot.findAll({
        where: {
          day_of_week: dayName,
          is_active: true,
          start_date: { [Op.lte]: date },
          [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: date } }]
        },
        order: [['start_time', 'ASC']]
      });
      const data = await Promise.all(slots.map(async slot => {
        const bookedCount = await SlotBooking.count({
          where: {
            slot_id: slot.id,
            status: { [Op.in]: ['confirmed', 'completed'] },
            booked_date: { [Op.between]: [date + ' 00:00:00', date + ' 23:59:59'] }
          }
        });
        return {
          slot_id: slot.id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          available_spots: Math.max(0, slot.max_bookings - bookedCount),
          description: slot.description
        };
      }));
      return res.status(200).json({ success: true, message: 'Slots fetched successfully', data });
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Failed to fetch slots: ' + e.message });
    }
  },

  async bookSlot(req, res) {
    try {
      const user = req.user;
      const { slot_id, booked_date, notes } = req.body;
      if (!slot_id || !booked_date) return res.status(422).json({ success: false, message: 'slot_id and booked_date are required' });
      const slot = await Slot.findByPk(slot_id);
      if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
      const dateOnly = booked_date;
      if (slot.start_date > dateOnly || (slot.end_date && slot.end_date < dateOnly)) {
        return res.status(400).json({ success: false, message: 'Slot is not available for the selected date' });
      }
      const existingBooking = await SlotBooking.findOne({
        where: {
          slot_id: slot.id,
          user_id: user.id,
          status: { [Op.in]: ['confirmed', 'completed'] },
          booked_date: { [Op.between]: [dateOnly + ' 00:00:00', dateOnly + ' 23:59:59'] }
        }
      });
      if (existingBooking) return res.status(409).json({ success: false, message: 'You have already booked this slot for this date. A slot can only be booked once per date.', error_code: 'SLOT_ALREADY_BOOKED' });
      const anyExistingBooking = await SlotBooking.findOne({
        where: { slot_id: slot.id, user_id: user.id, status: { [Op.in]: ['confirmed', 'completed'] } }
      });
      if (anyExistingBooking) return res.status(409).json({ success: false, message: 'You have already booked this slot. Each slot can only be booked once per user.', error_code: 'SLOT_ALREADY_BOOKED_ONCE', booked_date: anyExistingBooking.booked_date?.toISOString().slice(0,10) || null });
      const bookedCount = await SlotBooking.count({
        where: {
          slot_id: slot.id,
          status: { [Op.in]: ['confirmed', 'completed'] },
          booked_date: { [Op.between]: [dateOnly + ' 00:00:00', dateOnly + ' 23:59:59'] }
        }
      });
      if (bookedCount >= slot.max_bookings) return res.status(400).json({ success: false, message: 'Slot is fully booked for the selected date' });
      const booking = await SlotBooking.create({
        slot_id: slot.id,
        user_id: user.id,
        booked_date: dateOnly + ' 00:00:00',
        notes: notes || null,
        status: 'confirmed'
      });
      await slot.increment('current_bookings');
      return res.status(201).json({
        success: true,
        message: 'Slot booked successfully',
        data: { booking_id: booking.id, slot_id: slot.id, date: dateOnly, time: `${slot.start_time} - ${slot.end_time}` }
      });
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Failed to book slot: ' + e.message });
    }
  },

  async getUserBookings(req, res) {
    try {
      const user = req.user;
      const page = parseInt(req.query.page || '1', 10);
      const limit = 20;
      const offset = (page - 1) * limit;
      const { count, rows } = await SlotBooking.findAndCountAll({
        where: { user_id: user.id },
        include: [{ model: Slot, as: 'Slot' }],
        order: [['booked_date', 'DESC']],
        limit,
        offset
      });
      return res.status(200).json({
        success: true,
        message: 'User bookings fetched successfully',
        data: { total: count, per_page: limit, current_page: page, data: rows }
      });
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Failed to fetch bookings: ' + e.message });
    }
  },

  async cancelBooking(req, res) {
    try {
      const user = req.user;
      const bookingId = req.params.id;
      const booking = await SlotBooking.findByPk(bookingId, { include: [{ model: Slot, as: 'Slot' }] });
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
      if (booking.user_id !== user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });
      if (booking.status !== 'confirmed') return res.status(400).json({ success: false, message: 'This booking cannot be cancelled' });
      await booking.update({ status: 'cancelled' });
      if (booking.Slot) await booking.Slot.decrement('current_bookings');
      return res.status(200).json({ success: true, message: 'Booking cancelled successfully' });
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Failed to cancel booking: ' + e.message });
    }
  },

  async getCalendarData(req, res) {
    try {
      const month = parseInt(req.query.month, 10);
      const year = parseInt(req.query.year, 10);
      if (!month || !year) return res.status(422).json({ success: false, message: 'month and year are required' });
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const slots = await Slot.findAll({
        where: {
          is_active: true,
          start_date: { [Op.lte]: endDate.toISOString().slice(0,10) },
          [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: startDate.toISOString().slice(0,10) } }]
        }
      });
      const calendarData = {};
      let current = new Date(startDate);
      while (current <= endDate) {
        const dayName = current.toLocaleString('en-US', { weekday: 'long' });
        const dateStr = current.toISOString().slice(0,10);
        const daySlots = slots.filter(s => s.day_of_week === dayName);
        const mapped = await Promise.all(daySlots.map(async slot => {
          const bookedCount = await SlotBooking.count({
            where: {
              slot_id: slot.id,
              status: { [Op.in]: ['confirmed', 'completed'] },
              booked_date: { [Op.between]: [dateStr + ' 00:00:00', dateStr + ' 23:59:59'] }
            }
          });
          return {
            slot_id: slot.id,
            start_time: slot.start_time,
            end_time: slot.end_time,
            available: bookedCount < slot.max_bookings,
            booked_count: bookedCount,
            max_bookings: slot.max_bookings
          };
        }));
        if (mapped.length) calendarData[dateStr] = mapped;
        current.setDate(current.getDate() + 1);
      }
      return res.status(200).json({ success: true, message: 'Calendar data fetched successfully', data: calendarData });
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Failed to fetch calendar data: ' + e.message });
    }
  }
};