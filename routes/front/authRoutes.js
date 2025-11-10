// routes/front/authRoutes.js
// /api/auth/*
const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');
const { authMiddleware } = require('../../middleware/auth');

// Public
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected
router.post('/logout', authMiddleware, authController.logout);
router.get('/user', authMiddleware, authController.user);

module.exports = router;