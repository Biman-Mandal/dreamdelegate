// routes/admin.js
// Mounts server-side admin UI / admin API under /admin
const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Admin auth endpoints (login page or API)
const authController = require('../controllers/authController');
router.get('/login', (req, res) => {
  // server-rendered admin login view (implement view if you use templates)
  if (res.render) return res.render('admin.auth.login');
  return res.send('Admin login view');
});
router.post('/login', authController.adminLogin);

// Apply auth + admin role for all admin routes below
router.use(authMiddleware);
router.use(checkRole('admin'));

// Admin sub-route groups
router.use('/slots', require('./admin/slotRoutes'));
router.use('/support-tickets', require('./admin/supportRoutes'));
router.use('/roles', require('./admin/roleRoutes'));
router.use('/permissions', require('./admin/permissionRoutes'));
router.use('/users', require('./admin/userRoutes'));
router.use('/plans', require('./admin/planRoutes'));
router.use('/purchase-history', require('./admin/purchaseHistoryRoutes'));
router.use('/profile', require('./admin/profileRoutes'));

module.exports = router;