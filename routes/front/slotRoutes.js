// routes/front/slotRoutes.js
// /api/slots/*
const express = require('express');
const router = express.Router();
const SlotController = require('../../controllers/api/SlotController');
const { authMiddleware } = require('../../middleware/auth');

// Public
router.get('/available', SlotController.getAvailableSlots);
router.get('/by-day', SlotController.getSlotsByDay);
router.get('/calendar', SlotController.getCalendarData);

// Protected (user)
router.post('/book', authMiddleware, SlotController.bookSlot);
router.get('/my-bookings', authMiddleware, SlotController.getUserBookings);
router.post('/bookings/:id/cancel', authMiddleware, SlotController.cancelBooking);

module.exports = router;