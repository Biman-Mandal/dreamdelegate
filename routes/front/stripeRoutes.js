// routes/front/stripeRoutes.js
// /api/stripe/*
const express = require('express');
const router = express.Router();
const stripeController = require('../../controllers/api/StripePaymentController');
const { authMiddleware } = require('../../middleware/auth');

// Public webhook endpoint (Stripe posts here)
router.post('/webhook', stripeController.webhook);

// Create checkout session: allow optional auth (frontend may pass token)
router.post('/checkout', stripeController.createCheckoutSession);

// Verify payment (frontend calls with session_id)
router.post('/verify-payment', stripeController.verifyPayment);

// Authenticated endpoints
router.get('/transactions', authMiddleware, stripeController.getTransactionHistory);
router.get('/active-subscription', authMiddleware, stripeController.getActiveSubscription);

module.exports = router;