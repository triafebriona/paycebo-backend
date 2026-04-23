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
      order: [['created_at', 'DESC']]
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
  console.log(`[WEBHOOK] ===== START =====`);
  console.log(`[WEBHOOK] Payment ID: ${paymentId}, Status: ${status}`);
  
  try {
    // 1. Cari payment berdasarkan payment_id (UUID)
    console.log(`[WEBHOOK] Mencari payment dengan UUID: ${paymentId}`);
    
    const payment = await Payment.findOne({
      where: { payment_id: paymentId }
    });
    
    if (!payment) {
      console.log(`[WEBHOOK] ERROR: Payment dengan UUID ${paymentId} tidak ditemukan`);
      return false;
    }
    
    console.log(`[WEBHOOK] Payment ditemukan! ID: ${payment.id}, Merchant: ${payment.merchant_id}`);
    
    // 2. Cari webhook URL merchant
    console.log(`[WEBHOOK] Mencari webhook untuk merchant ${payment.merchant_id}`);
    
    const webhook = await Webhook.findOne({
      where: { merchant_id: payment.merchant_id }
    });
    
    if (!webhook) {
      console.log(`[WEBHOOK] ERROR: Tidak ada webhook untuk merchant ${payment.merchant_id}`);
      return false;
    }
    
    console.log(`[WEBHOOK] Webhook ditemukan: ${webhook.url}`);
    
    // 3. Siapkan payload (format sesuai yang diharapkan operation service)
    const payload = {
      order_id: payment.payment_id,
      transaction_status: status,
      gross_amount: parseFloat(payment.amount),
      payment_type: 'card',
      transaction_time: payment.createdAt || new Date().toISOString(),
      settlement_time: new Date().toISOString()
    };
    
    console.log(`[WEBHOOK] Payload:`, JSON.stringify(payload));
    
    // 4. Kirim webhook
    console.log(`[WEBHOOK] Mengirim ke: ${webhook.url}`);
    
    let success = false;
    let statusCode = null;
    let responseBody = null;
    let errorMessage = null;
    
    try {
      const response = await axios.post(webhook.url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      
      success = response.status >= 200 && response.status < 300;
      statusCode = response.status;
      responseBody = JSON.stringify(response.data);
      
      console.log(`[WEBHOOK] RESPONSE: Status ${statusCode}, Success: ${success}`);
      if (responseBody) console.log(`[WEBHOOK] Response body: ${responseBody}`);
      
    } catch (webhookError) {
      success = false;
      statusCode = webhookError.response?.status;
      responseBody = webhookError.response?.data ? JSON.stringify(webhookError.response.data) : null;
      errorMessage = webhookError.message;
      
      console.error(`[WEBHOOK] ERROR KIRIM: ${errorMessage}`);
      if (statusCode) console.error(`[WEBHOOK] Status code: ${statusCode}`);
      if (responseBody) console.error(`[WEBHOOK] Response body: ${responseBody}`);
    }
    
    // 5. Log webhook attempt
    try {
      await WebhookLog.create({
        merchant_id: payment.merchant_id,
        payment_id: payment.id,
        webhook_id: webhook.id,
        url: webhook.url,
        status_code: statusCode,
        request_body: JSON.stringify(payload),
        response_body: responseBody,
        success: success,
        error_message: errorMessage,
        retry_count: 0
      });
      console.log(`[WEBHOOK] Log tersimpan di database`);
    } catch (logError) {
      console.error(`[WEBHOOK] Gagal menyimpan log:`, logError.message);
    }
    
    // 6. Update webhook_sent jika sukses
    if (success) {
      payment.webhook_sent = true;
      await payment.save();
      console.log(`[WEBHOOK] Status webhook_sent diupdate`);
    }
    
    console.log(`[WEBHOOK] ===== SELESAI =====`);
    return success;
    
  } catch (err) {
    console.error(`[WEBHOOK] UNCAUGHT ERROR:`, err);
    console.error(err.stack);
    console.log(`[WEBHOOK] ===== GAGAL TOTAL =====`);
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
    res.status(500).json({ message: 'Servmaser error', error: err.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
    try {
        const { payment_id, status } = req.body;
        
        if (!payment_id || !status) {
            return res.status(400).json({ message: 'payment_id and status are required' });
        }
        
        const payment = await Payment.findOne({ where: { payment_id: payment_id } });
        
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        
        payment.status = status;
        await payment.save();
        
        console.log(`[PAYMENT] Updated payment ${payment_id} status to ${status}`);
        res.json({ success: true, message: 'Status updated' });
        
    } catch (err) {
        console.error('[PAYMENT] Update status error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};