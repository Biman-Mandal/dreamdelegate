// routes/front/supportRoutes.js
// /api/support-tickets/*
const express = require('express');
const router = express.Router();
const SupportController = require('../../controllers/api/SupportController');
const { authMiddleware } = require('../../middleware/auth');

// Protected: users must be authenticated to create/list/reply/close
router.post('/', authMiddleware, SupportController.createTicket);
router.get('/', authMiddleware, SupportController.listTickets);
router.get('/:id', authMiddleware, SupportController.showTicket);
router.post('/:id/reply', authMiddleware, SupportController.replyTicket);
router.post('/:id/close', authMiddleware, SupportController.closeTicket);

module.exports = router;