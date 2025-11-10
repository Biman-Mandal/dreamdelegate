// routes/admin/profileRoutes.js
// /admin/profile/*
const express = require('express');
const router = express.Router();
const profileController = require('../../controllers/admin/ProfileController');

// edit / update profile (uses auth middleware in parent)
router.get('/edit', profileController.edit);
router.put('/update', profileController.update);
router.put('/password', profileController.updatePassword);

module.exports = router;