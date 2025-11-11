const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

const DashboardController = (req, res) => res.send('Admin Dashboard placeholder');

// Public routes
router.get('/', (req, res) => res.redirect('/admin/login'));
router.get('/admin/login', (req, res) => res.send('Login view placeholder'));

// Admin protected
router.use('/admin', authMiddleware, checkRole('admin'));
router.get('/admin/dashboard', DashboardController);

// For admin controllers (users, roles, permissions, plans, profile, slots, support)
router.get('/admin/purchase-history', (req, res) => res.send('Purchase history view placeholder'));

module.exports = router;