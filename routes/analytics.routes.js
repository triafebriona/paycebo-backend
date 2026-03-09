const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/dashboard', verifyToken, analyticsController.getDashboardStats);
router.get('/transactions-by-date', verifyToken, analyticsController.getTransactionsByDate);
router.get('/transactions-by-status', verifyToken, analyticsController.getTransactionsByStatus);
router.get('/transactions-by-currency', verifyToken, analyticsController.getTransactionsByCurrency);
router.get('/amount-distribution', verifyToken, analyticsController.getAmountDistribution);

module.exports = router;