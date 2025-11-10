// routes/admin/apiAdminRoutes.js
// Mounted under /api/admin - admin APIs that are part of the public API namespace
const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

const adminUserRoutes = require('./admin/userRoutes');
const roleRoutes = require('./admin/roleRoutes');
const permissionRoutes = require('./admin/permissionRoutes');

// Protect all /api/admin with auth + admin role
router.use(authMiddleware);
router.use(checkRole('admin'));

// Mount admin API controllers
router.use('/users', adminUserRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);

module.exports = router;