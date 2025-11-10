// routes/front/planRoutes.js
// /api/plans/*
const express = require('express');
const router = express.Router();
const planController = require('../../controllers/api/PlanController'); // implement controller
const { authMiddleware } = require('../../middleware/auth');

// Public list of plans (optionally returns user current plan when auth provided)
router.get('/', planController.index);

// Authenticated routes for plan info
router.get('/current', authMiddleware, planController.current);

module.exports = router;