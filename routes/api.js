// routes/api.js
// Mounts all front-facing API routes under /api
const express = require('express');
const router = express.Router();

// front-facing route groups
const authRoutes = require('./front/authRoutes');
const planRoutes = require('./front/planRoutes');
const stripeRoutes = require('./front/stripeRoutes');
const slotRoutes = require('./front/slotRoutes');
const supportRoutes = require('./front/supportRoutes');

// optional admin APIs accessible under /api/admin (protected by admin middleware inside that router)
const apiAdminRoutes = require('./apiAdminRoutes');

// Public auth & listings
router.use('/auth', authRoutes);
router.use('/plans', planRoutes);

// Stripe public/optional routes (checkout for guests + webhook)
router.use('/stripe', stripeRoutes);

// Front slot & support routes
router.use('/slots', slotRoutes);
router.use('/support-tickets', supportRoutes);

// Admin API endpoints under /api/admin (these are API endpoints, not admin UI)
router.use('/admin', apiAdminRoutes);

module.exports = router;