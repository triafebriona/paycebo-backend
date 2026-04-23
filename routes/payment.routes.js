const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { verifyToken, verifyApiKey } = require('../middlewares/auth.middleware');

router.post('/create-payment', verifyApiKey, paymentController.createPayment);
router.get('/payment/:paymentId', verifyToken, paymentController.getPaymentDetails);
router.get('/payments', verifyToken, paymentController.getAllPayments);
router.post('/webhook', verifyToken, paymentController.setWebhook);
router.get('/webhook', verifyToken, paymentController.getWebhook);
router.get('/webhook-logs', verifyToken, paymentController.getWebhookLogs);
router.post('/webhook-logs/:logId/retry', verifyToken, paymentController.retryWebhook);
router.post('/payments/update-status', paymentController.updatePaymentStatus);

module.exports = router;