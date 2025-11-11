const { Slot, SlotBooking } = require('../../models');
const { Op } = require('sequelize');

exports.getAvailableSlots = async (req, res) => {
  try {
    const { start_date, end_date } = req.body;
    if (!start_date || !end_date) return res.status(400).json({ success: false, message: 'start_date and end_date required' });

    const result = await Slot.getAvailableSlotsForDateRange(start_date, end_date);
    return res.json({ success: true, message: 'Available slots fetched successfully', data: result });
  } catch (err) {
    console.error('SlotController.getAvailableSlots', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch available slots', error: err.message });
  }
};

exports.getSlotsByDay = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'date required' });

    const dayName = new Date(date).toLocaleString('en-US', { weekday: 'long' });

    const slots = await Slot.findAll({
      where: {
        day_of_week: dayName,
        is_active: true,
        start_date: { [Op.lte]: date },
        [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: date } }],
      },
    });

    const mapped = await Promise.all(slots.map(async s => {
      const bookedCount = await s.countSlotBookings({ where: { status: 'confirmed', booked_date: date } });
      return {
        slot_id: s.id,
        start_time: s.start_time,
        end_time: s.end_time,
        available_spots: s.max_bookings - bookedCount,
        description: s.description,
      };
    }));

    return res.json({ success: true, message: 'Slots fetched successfully', data: mapped });
  } catch (err) {
    console.error('SlotController.getSlotsByDay', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch slots', error: err.message });
  }
};

exports.bookSlot = async (req, res) => {
  try {
    const { slot_id, booked_date, notes } = req.body;
    const user = req.user;
    if (!slot_id || !booked_date) return res.status(400).json({ success: false, message: 'slot_id and booked_date required' });

    const slot = await Slot.findByPk(slot_id);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

    if (!(await slot.isAvailableForDate(booked_date))) {
      return res.status(400).json({ success: false, message: 'Slot is not available for the selected date' });
    }

    const existingBooking = await SlotBooking.findOne({
      where: { slot_id: slot.id, user_id: user.id, booked_date, status: { [Op.in]: ['confirmed', 'completed'] } },
    });
    if (existingBooking) {
      return res.status(409).json({ success: false, message: 'You have already booked this slot for this date. A slot can only be booked once per date.', error_code: 'SLOT_ALREADY_BOOKED' });
    }

    const anyExisting = await SlotBooking.findOne({
      where: { slot_id: slot.id, user_id: user.id, status: { [Op.in]: ['confirmed', 'completed'] } },
    });
    if (anyExisting) {
      return res.status(409).json({ success: false, message: 'You have already booked this slot. Each slot can only be booked once per user.', error_code: 'SLOT_ALREADY_BOOKED_ONCE', booked_date: anyExisting.booked_date });
    }

    const booking = await SlotBooking.create({ slot_id: slot.id, user_id: user.id, booked_date, notes: notes ?? null, status: 'confirmed' });
    await slot.increment('current_bookings');

    return res.status(201).json({
      success: true,
      message: 'Slot booked successfully',
      data: {
        booking_id: booking.id,
        slot_id: slot.id,
        date: booking.booked_date.toISOString().slice(0, 10),
        time: `${slot.start_time} - ${slot.end_time}`,
      },
    });
  } catch (err) {
    console.error('SlotController.bookSlot', err);
    return res.status(500).json({ success: false, message: 'Failed to book slot', error: err.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await SlotBooking.findAll({ where: { user_id: req.user.id }, include: ['slot'], order: [['booked_date', 'DESC']] });
    return res.json({ success: true, message: 'User bookings fetched successfully', data: bookings });
  } catch (err) {
    console.error('SlotController.getUserBookings', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch bookings', error: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await SlotBooking.findByPk(req.params.bookingId, { include: ['slot'] });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });
    if (booking.status !== 'confirmed') return res.status(400).json({ success: false, message: 'This booking cannot be cancelled' });

    await booking.update({ status: 'cancelled' });
    if (booking.slot) await booking.slot.decrement('current_bookings');

    return res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (err) {
    console.error('SlotController.cancelBooking', err);
    return res.status(500).json({ success: false, message: 'Failed to cancel booking', error: err.message });
  }
};

exports.getCalendarData = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ success: false, message: 'month and year required' });

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const slots = await Slot.findAll({ where: { is_active: true } });
    const calendarData = {};
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayName = d.toLocaleString('en-US', { weekday: 'long' });
      const dateStr = d.toISOString().slice(0, 10);
      const daySlots = [];
      for (const s of slots) {
        if (s.day_of_week === dayName && await s.isAvailableForDate(d)) {
          const bookedCount = await s.countSlotBookings({ where: { booked_date: d, status: 'confirmed' } });
          daySlots.push({
            slot_id: s.id,
            start_time: s.start_time,
            end_time: s.end_time,
            available: bookedCount < s.max_bookings,
            booked_count: bookedCount,
            max_bookings: s.max_bookings,
          });
        }
      }
      if (daySlots.length) calendarData[dateStr] = daySlots;
    }

    return res.json({ success: true, message: 'Calendar data fetched successfully', data: calendarData });
  } catch (err) {
    console.error('SlotController.getCalendarData', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch calendar data', error: err.message });
  }
};