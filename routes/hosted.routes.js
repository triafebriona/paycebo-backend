const express = require('express');
const router = express.Router();
const hostedController = require('../controllers/hosted.controller');

router.get('/:paymentId', hostedController.getPaymentPage);
router.post('/submit', hostedController.submitPayment);

module.exports = router;