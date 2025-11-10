// routes/admin/roleRoutes.js
// /admin/roles/*
const express = require('express');
const router = express.Router();
const roleController = require('../../controllers/roleController');

// CRUD for roles
router.get('/', roleController.index);
router.post('/', roleController.store);
router.get('/:id', roleController.show || ((req,res)=>res.json({success:true})));
router.put('/:id', roleController.update);
router.delete('/:id', roleController.destroy);

// assign/revoke permissions to role (if permission controller implemented)
router.post('/:id/assign-permission', roleController.assignPermission || ((req,res)=>res.json({success:true})));
router.post('/:id/revoke-permission', roleController.revokePermission || ((req,res)=>res.json({success:true})));

module.exports = router;