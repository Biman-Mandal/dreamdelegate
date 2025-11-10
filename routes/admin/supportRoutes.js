// routes/admin/supportRoutes.js
// /admin/support-tickets/*
const express = require('express');
const router = express.Router();
const SupportAdminController = require('../../controllers/admin/SupportAdminController');

// Admin-only endpoints
router.get('/', SupportAdminController.index);
router.get('/:id', SupportAdminController.show);
router.post('/:id/reply', SupportAdminController.addReply);
router.post('/:id/status', SupportAdminController.updateStatus);
router.post('/:id/assign', SupportAdminController.assign);
router.post('/:id/priority', SupportAdminController.updatePriority);

module.exports = router;