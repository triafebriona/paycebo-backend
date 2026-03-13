const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const db = require('../models');
const Payment = db.payments;
const Webhook = db.webhooks;
const WebhookLog = db.webhooklogs;
const { Op, Sequelize } = db.Sequelize;

exports.createPayment = async (req, res) => {
  try {
    const { amount, currency, redirect_url, merchant_reference } = req.body;
    const merchantId = req.merchantId;
    
    if (!amount || !redirect_url) {
      return res.status(400).json({ message: 'Amount and redirect_url are required' });
    }
    
    const paymentId = uuidv4(); 
    
    await Payment.create({
      payment_id: paymentId,
      merchant_id: merchantId,
      amount,
      currency: currency || 'IDR',
      status: 'pending',
      redirect_url,
      merchant_reference
    });
    
    res.status(201).json({
      message: 'Payment created successfully',
      payment_id: paymentId
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const merchantId = req.merchantId;
    
    const payment = await Payment.findOne({
      where: {
        id: paymentId,
        merchant_id: merchantId
      }
    });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    res.status(200).json({
      payment_id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      created_at: payment.createdAt
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    
    const payments = await Payment.findAll({
      where: { merchant_id: merchantId },
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.setWebhook = async (req, res) => {
  try {
    const { url } = req.body;
    const merchantId = req.merchantId;
    
    if (!url) {
      return res.status(400).json({ message: 'Webhook URL is required' });
    }
    
    const [webhook, created] = await Webhook.findOrCreate({
      where: { merchant_id: merchantId },
      defaults: { url }
    });
    
    if (!created) {
      webhook.url = url;
      await webhook.save();
    }
    
    res.status(200).json({
      message: 'Webhook URL set successfully',
      webhook: {
        id: webhook.id,
        url: webhook.url
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getWebhook = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    
    const webhook = await Webhook.findOne({
      where: { merchant_id: merchantId }
    });
    
    if (!webhook) {
      return res.status(404).json({ message: 'No webhook URL found' });
    }
    
    res.status(200).json({
      webhook: {
        id: webhook.id,
        url: webhook.url
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.sendWebhook = async (paymentId, status) => {
  try {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return;
    
    const webhook = await Webhook.findOne({
      where: { merchant_id: payment.merchant_id }
    });
    
    if (!webhook) return;
    
    const payload = {
      payment_id: payment.id,
      merchant_id: payment.merchant_id,
      amount: payment.amount,
      currency: payment.currency,
      status,
      timestamp: new Date().toISOString()
    };
    
    let success = false;
    let statusCode = null;
    let responseBody = null;
    let errorMessage = null;
    
    try {
      const response = await axios.post(webhook.url, payload);
      success = response.status >= 200 && response.status < 300;
      statusCode = response.status;
      responseBody = JSON.stringify(response.data);
    } catch (webhookError) {
      success = false;
      statusCode = webhookError.response?.status;
      responseBody = webhookError.response?.data ? JSON.stringify(webhookError.response.data) : null;
      errorMessage = webhookError.message;
    }
    
    // Log the webhook attempt
    await WebhookLog.create({
      merchant_id: payment.merchant_id,
      payment_id: payment.id,
      webhook_id: webhook.id,
      url: webhook.url,
      status_code: statusCode,
      request_body: JSON.stringify(payload),
      response_body: responseBody,
      success,
      error_message: errorMessage,
      retry_count: 0
    });
    
    if (success) {
      payment.webhook_sent = true;
      await payment.save();
    }
    
    return success;
  } catch (err) {
    console.error('Webhook processing failed:', err);
    return false;
  }
};

exports.getWebhookLogs = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    
    const logs = await WebhookLog.findAll({
      where: { merchant_id: merchantId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Payment,
          attributes: ['amount', 'currency', 'status']
        }
      ]
    });
    
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.retryWebhook = async (req, res) => {
  try {
    const { logId } = req.params;
    const merchantId = req.merchantId;
    
    const log = await WebhookLog.findOne({
      where: { id: logId, merchant_id: merchantId },
      include: [
        {
          model: Payment,
          attributes: ['id', 'status', 'webhook_sent']
        },
        {
          model: Webhook,
          attributes: ['url']
        }
      ]
    });
    
    if (!log) {
      return res.status(404).json({ message: 'Webhook log not found' });
    }
    
    if (log.success) {
      return res.status(400).json({ message: 'Webhook was already successful' });
    }
    
    // Parse the original payload
    const payload = JSON.parse(log.request_body);
    
    let success = false;
    let statusCode = null;
    let responseBody = null;
    let errorMessage = null;
    
    try {
      const response = await axios.post(log.webhook.url, payload);
      success = response.status >= 200 && response.status < 300;
      statusCode = response.status;
      responseBody = JSON.stringify(response.data);
    } catch (webhookError) {
      success = false;
      statusCode = webhookError.response?.status;
      responseBody = webhookError.response?.data ? JSON.stringify(webhookError.response.data) : null;
      errorMessage = webhookError.message;
    }
    
    // Create a new log entry for this retry
    const newLog = await WebhookLog.create({
      merchant_id: log.merchant_id,
      payment_id: log.payment_id,
      webhook_id: log.webhook_id,
      url: log.webhook.url,
      status_code: statusCode,
      request_body: log.request_body,
      response_body: responseBody,
      success,
      error_message: errorMessage,
      retry_count: log.retry_count + 1
    });
    
    if (success && log.payment) {
      log.payment.webhook_sent = true;
      await log.payment.save();
    }
    
    res.status(200).json({
      message: success ? 'Webhook retry successful' : 'Webhook retry failed',
      success,
      log: newLog
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};