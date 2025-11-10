// routes/admin/permissionRoutes.js
// /admin/permissions/*
const express = require('express');
const router = express.Router();
const permissionController = require('../../controllers/admin/PermissionController');

// CRUD for permissions (if implemented)
router.get('/', permissionController.index);
router.get('/by-module', permissionController.byModule);
router.post('/', permissionController.store);
router.get('/:id', permissionController.show);
router.put('/:id', permissionController.update);
router.delete('/:id', permissionController.destroy);

module.exports = router;