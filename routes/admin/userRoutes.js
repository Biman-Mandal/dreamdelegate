// routes/admin/userRoutes.js
// /admin/users/*
// Admin user CRUD and role assignment endpoints
const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin/adminController'); // user functions inside adminController
// const userAdminController = require('../../controllers/admin/UserAdminController'); // optional split controller

// List and manage users
router.get('/', adminController.listUsers);
router.post('/', adminController.createUser);
router.get('/:id', adminController.getUser);
router.put('/:id', adminController.updateUser);
router.delete('/:id', adminController.deleteUser);

// Optionally endpoints to assign/remove roles
router.post('/:id/assign-role', adminController.assignRole);
router.post('/:id/remove-role', adminController.removeRole);

module.exports = router;