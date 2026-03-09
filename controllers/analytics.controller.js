const db = require('../models');
const Payment = db.payments;
const { Op, Sequelize } = db.Sequelize;

exports.getDashboardStats = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    
    // Get total transactions count
    const totalTransactions = await Payment.count({
      where: { merchant_id: merchantId }
    });
    
    // Get successful transactions count
    const successfulTransactions = await Payment.count({
      where: { 
        merchant_id: merchantId,
        status: 'success'
      }
    });
    
    // Calculate success rate
    const successRate = totalTransactions > 0 
      ? Math.round((successfulTransactions / totalTransactions) * 100) 
      : 0;
    
    // Get total amount processed
    const totalAmount = await Payment.sum('amount', {
      where: { 
        merchant_id: merchantId,
        status: 'success'
      }
    }) || 0;
    
    // Get recent transactions
    const recentTransactions = await Payment.findAll({
      where: { merchant_id: merchantId },
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    res.status(200).json({
      totalTransactions,
      successfulTransactions,
      successRate,
      totalAmount,
      recentTransactions
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getTransactionsByDate = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { period } = req.query;
    
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // Default to 30 days
    }
    
    // Group transactions by date
    const transactions = await Payment.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN status = "success" THEN 1 ELSE 0 END')), 'successful'],
        [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN status = "failed" OR status = "declined" OR status = "insufficient_funds" OR status = "expired_card" OR status = "timeout" THEN 1 ELSE 0 END')), 'failed'],
        [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN status = "processing" THEN 1 ELSE 0 END')), 'processing'],
        [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN status = "success" THEN amount ELSE 0 END')), 'amount']
      ],
      where: { 
        merchant_id: merchantId,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'ASC']]
    });
    
    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getTransactionsByStatus = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    
    const statusCounts = await Payment.findAll({
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: { merchant_id: merchantId },
      group: ['status'],
      order: [[Sequelize.literal('count'), 'DESC']]
    });
    
    res.status(200).json(statusCounts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getTransactionsByCurrency = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    
    const currencyCounts = await Payment.findAll({
      attributes: [
        'currency',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN status = "success" THEN amount ELSE 0 END')), 'amount']
      ],
      where: { merchant_id: merchantId },
      group: ['currency'],
      order: [[Sequelize.literal('count'), 'DESC']]
    });
    
    res.status(200).json(currencyCounts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAmountDistribution = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    
    // Define amount ranges
    const ranges = [
      { min: 0, max: 100, label: '0-100' },
      { min: 100, max: 500, label: '100-500' },
      { min: 500, max: 1000, label: '500-1000' },
      { min: 1000, max: 5000, label: '1000-5000' },
      { min: 5000, max: Number.MAX_SAFE_INTEGER, label: '5000+' }
    ];
    
    // Initialize result array
    const distribution = [];
    
    // Query for each range
    for (const range of ranges) {
      const count = await Payment.count({
        where: {
          merchant_id: merchantId,
          amount: {
            [Op.gte]: range.min,
            [Op.lt]: range.max
          }
        }
      });
      
      distribution.push({
        range: range.label,
        count
      });
    }
    
    res.status(200).json(distribution);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};