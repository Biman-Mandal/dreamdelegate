// routes/admin/purchaseHistoryRoutes.js
// /admin/purchase-history/*
const express = require('express');
const router = express.Router();
const purchaseController = require('../../controllers/admin/PurchaseHistoryController');

router.get('/', purchaseController.index);
router.get('/:id', purchaseController.show);
router.get('/export', purchaseController.export);

module.exports = router;