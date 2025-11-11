const express = require('express');
const router = express.Router();

const optionalAuth = require('../middleware/optionalAuth');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Front controllers
const AuthController = require('../controllers/front/AuthController');
const RoleController = require('../controllers/front/RoleController');
const PermissionController = require('../controllers/front/PermissionController');
const UserController = require('../controllers/front/UserController');
const PlanSubscriptionController = require('../controllers/front/PlanSubscriptionController');
const SlotController = require('../controllers/front/SlotController');
const SupportTicketController = require('../controllers/front/SupportTicketController');
const StripePaymentController = require('../controllers/front/StripePaymentController');


// Mount admin routes (admin APIs live in src/routes/admin.js)

// Public routes
router.post('/stripe', (req, res) => res.sendStatus(200)); // webhook - mounted separately if implemented
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);

// Public plans (optional auth)
router.get('/plans', optionalAuth, PlanSubscriptionController.index);

// Stripe public routes (optional auth)
router.post('/stripe/checkout', optionalAuth, StripePaymentController.createCheckoutSession);
router.post('/stripe/verify-payment', optionalAuth, StripePaymentController.verifyPayment);

// Protected routes
router.use(auth);

router.get('/profile', UserController.show);
router.put('/profile', UserController.update);
router.put('/profile/password', UserController.updatePassword);
// Auth
router.post('/auth/logout', AuthController.logout);
router.get('/auth/user', AuthController.user);

// Plans
router.get('/plans/current', StripePaymentController.getActiveSubscription);

// Role & Permission (admin-only handled by admin routes); expose read for front if needed
router.get('/roles', RoleController.index);
router.get('/permissions', PermissionController.index);
router.get('/permissions/by-module', PermissionController.byModule);

// User endpoints (admin operations are under /admin/users; this exposes public administrative user CRUD only if needed)
// For admin functionality use /admin

// Stripe user routes
router.get('/stripe/transactions', StripePaymentController.getTransactionHistory);
router.get('/stripe/active-subscription', StripePaymentController.getActiveSubscription);

// Support tickets (authenticated)
router.post('/support-tickets', SupportTicketController.store);
router.get('/support-tickets', SupportTicketController.index);
router.get('/support-tickets/:ticketId', async (req, res, next) => {
  const { SupportTicket } = require('../models');
  const ticket = await SupportTicket.findByPk(req.params.ticketId);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  req.ticket = ticket;
  next();
}, SupportTicketController.show);
router.post('/support-tickets/:ticketId/reply', async (req, res, next) => {
  const { SupportTicket } = require('../models');
  const ticket = await SupportTicket.findByPk(req.params.ticketId);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  req.ticket = ticket;
  next();
}, SupportTicketController.addReply);
router.post('/support-tickets/:ticketId/close', async (req, res, next) => {
  const { SupportTicket } = require('../models');
  const ticket = await SupportTicket.findByPk(req.params.ticketId);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  req.ticket = ticket;
  next();
}, SupportTicketController.close);

// Slots
router.post('/slots/available', SlotController.getAvailableSlots);
router.get('/slots/by-day', SlotController.getSlotsByDay);
router.post('/slots/book', SlotController.bookSlot);
router.get('/slots/my-bookings', SlotController.getUserBookings);
router.post('/slots/bookings/:bookingId/cancel', SlotController.cancelBooking);
router.get('/slots/calendar', SlotController.getCalendarData);

module.exports = router;