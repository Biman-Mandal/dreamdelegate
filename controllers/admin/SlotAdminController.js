const { Op } = require('sequelize');
const { Slot, SlotBooking, User } = require('../../models');

module.exports = {
  async index(req, res) {
    try {
      const { day, status, search, page = 1 } = req.query;
      const where = {};
      if (day) where.day_of_week = day;
      if (typeof status !== 'undefined') where.is_active = status === 'active';
      if (search) where.description = { [Op.iLike]: `%${search}%` };
      const limit = 20;
      const offset = (page - 1) * limit;
      const { count, rows } = await Slot.findAndCountAll({ where, order: [['day_of_week', 'ASC'], ['start_time', 'ASC']], limit, offset });
      const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
      return res.json({ success: true, message: 'Slots fetched', data: { total: count, per_page: limit, current_page: parseInt(page,10), data: rows, days } });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  },

  create(req, res) {
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    return res.json({ success: true, days });
  },

  async store(req, res) {
    try {
      const v = req.body;
      const slot = await Slot.create({
        day_of_week: v.day_of_week,
        start_time: v.start_time,
        end_time: v.end_time,
        start_date: v.start_date,
        end_date: v.end_date || null,
        max_bookings: v.max_bookings || 1,
        description: v.description || null,
        is_active: v.is_active !== undefined ? !!v.is_active : true
      });
      return res.status(201).json({ success: true, message: 'Slot created successfully', data: slot });
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Failed to create slot: ' + e.message });
    }
  },

  async edit(req, res) {
    try {
      const slot = await Slot.findByPk(req.params.id);
      if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
      const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
      return res.json({ success: true, data: { slot, days } });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  },

  async update(req, res) {
    try {
      const slot = await Slot.findByPk(req.params.id);
      if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
      const v = req.body;
      await slot.update({
        day_of_week: v.day_of_week,
        start_time: v.start_time,
        end_time: v.end_time,
        start_date: v.start_date,
        end_date: v.end_date || null,
        max_bookings: v.max_bookings || 1,
        is_active: v.is_active !== undefined ? !!v.is_active : slot.is_active,
        description: v.description || slot.description
      });
      return res.json({ success: true, message: 'Slot updated successfully', data: slot });
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Failed to update slot: ' + e.message });
    }
  },

  async destroy(req, res) {
    try {
      const slot = await Slot.findByPk(req.params.id);
      if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
      await slot.destroy();
      return res.json({ success: true, message: 'Slot deleted successfully' });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  },

  async bookings(req, res) {
    try {
      const slotId = req.params.id;
      const bookings = await SlotBooking.findAll({ where: { slot_id: slotId }, include: [{ model: User, as: 'User' }], order: [['booked_date', 'DESC']] });
      return res.json({ success: true, message: 'Bookings fetched', data: bookings });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  },

  async cancelBooking(req, res) {
    try {
      const bookingId = req.params.bookingId;
      const booking = await SlotBooking.findByPk(bookingId, { include: [{ model: Slot, as: 'Slot' }] });
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
      await booking.update({ status: 'cancelled' });
      if (booking.Slot) await booking.Slot.decrement('current_bookings');
      return res.json({ success: true, message: 'Booking cancelled successfully' });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }
};