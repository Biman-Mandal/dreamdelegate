const { Slot, SlotBooking, User } = require('../../models');
const { Op } = require('sequelize');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 20;
    const where = {};
    if (req.query.day) where.day_of_week = req.query.day;
    if (req.query.status) where.is_active = req.query.status === 'active';
    if (req.query.search) where.description = { [Op.iLike]: `%${req.query.search}%` };

    const { rows, count } = await Slot.findAndCountAll({
      where,
      order: [['day_of_week', 'ASC'], ['start_time', 'ASC']],
    });

    return res.json({ success: true, data: { items: rows, days: DAYS } });
  } catch (e) {
    console.error('SlotAdminController.index', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch slots', error: e.message });
  }
};

exports.create = async (req, res) => {
  return res.json({ success: true, data: { days: DAYS } });
};

exports.store = async (req, res) => {
  try {
    const payload = {
      day_of_week: req.body.day_of_week,
      start_time: req.body.start_time,
      end_time: req.body.end_time,
      start_date: req.body.start_date,
      end_date: req.body.end_date ?? null,
      max_bookings: req.body.max_bookings ?? 1,
      description: req.body.description ?? null,
    };
    const slot = await Slot.create(payload);
    return res.status(201).json({ success: true, message: 'Slot created successfully', data: slot });
  } catch (e) {
    console.error('SlotAdminController.store', e);
    return res.status(500).json({ success: false, message: 'Failed to create slot', error: e.message });
  }
};

exports.edit = async (req, res) => {
  try {
    const slot = await Slot.findByPk(req.params.slotId);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
    return res.json({ success: true, data: { slot, days: DAYS } });
  } catch (e) {
    console.error('SlotAdminController.edit', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch slot', error: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const slot = await Slot.findByPk(req.params.slotId);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

    await slot.update({
      day_of_week: req.body.day_of_week,
      start_time: req.body.start_time,
      end_time: req.body.end_time,
      start_date: req.body.start_date,
      end_date: req.body.end_date ?? slot.end_date,
      max_bookings: req.body.max_bookings ?? slot.max_bookings,
      is_active: req.body.is_active === undefined ? slot.is_active : !!req.body.is_active,
      description: req.body.description ?? slot.description,
    });

    return res.json({ success: true, message: 'Slot updated successfully', data: slot });
  } catch (e) {
    console.error('SlotAdminController.update', e);
    return res.status(500).json({ success: false, message: 'Failed to update slot', error: e.message });
  }
};

exports.destroy = async (req, res) => {
  try {
    const slot = await Slot.findByPk(req.params.slotId);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
    await slot.destroy();
    return res.json({ success: true, message: 'Slot deleted successfully' });
  } catch (e) {
    console.error('SlotAdminController.destroy', e);
    return res.status(500).json({ success: false, message: 'Failed to delete slot', error: e.message });
  }
};

exports.bookings = async (req, res) => {
  try {
    const slot = await Slot.findByPk(req.params.slotId);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 20;

    const { rows, count } = await SlotBooking.findAndCountAll({
      where: { slot_id: slot.id },
      include: [{ model: require('../../models').User }],
      order: [['booked_date', 'DESC']],
    });

    return res.json({ success: true, data: { slot, bookings: rows} });
  } catch (e) {
    console.error('SlotAdminController.bookings', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch bookings', error: e.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await SlotBooking.findByPk(req.params.bookingId, { include: [Slot] });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    await booking.update({ status: 'cancelled' });
    if (booking.Slot) await booking.Slot.decrement('current_bookings');

    return res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (e) {
    console.error('SlotAdminController.cancelBooking', e);
    return res.status(500).json({ success: false, message: 'Failed to cancel booking', error: e.message });
  }
};