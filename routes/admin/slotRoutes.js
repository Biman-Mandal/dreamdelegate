// routes/admin/slotRoutes.js
// /admin/slots/*
const express = require('express');
const router = express.Router();
const SlotAdminController = require('../../controllers/admin/SlotAdminController');

// Admin protected by parent router (auth + checkRole('admin'))
router.get('/', SlotAdminController.index);
router.get('/create', SlotAdminController.create);
router.post('/', SlotAdminController.store);
router.get('/:id/edit', SlotAdminController.edit);
router.put('/:id', SlotAdminController.update);
router.delete('/:id', SlotAdminController.destroy);

// Bookings management
router.get('/:id/bookings', SlotAdminController.bookings);
router.post('/bookings/:bookingId/cancel', SlotAdminController.cancelBooking);

module.exports = router;