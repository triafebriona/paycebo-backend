const express = require('express');
const router = express.Router();
const brandingController = require('../controllers/branding.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, brandingController.getBranding);
router.put('/', verifyToken, brandingController.updateBranding);
router.get('/payment/:merchantId', brandingController.getPaymentPageBranding);

module.exports = router;