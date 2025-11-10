// routes/admin/planRoutes.js
// /admin/plans/*
const express = require('express');
const router = express.Router();
const planAdminController = require('../../controllers/admin/PlanSubscriptionController');

// list/create/update/delete plans (server-rendered or API)
router.get('/', planAdminController.index);
router.post('/', planAdminController.store);
router.put('/:id', planAdminController.update);
router.delete('/:id', planAdminController.destroy);

module.exports = router;