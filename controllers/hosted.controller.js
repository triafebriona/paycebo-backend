const db = require('../models');
const Payment = db.payments;
const paymentController = require('./payment.controller');
const testCardController = require('./testcard.controller');
const Branding = db.brandings;

exports.getPaymentPage = async (req, res) => {
  try {
    const { paymentId } = req.params;
        
    const payment = await Payment.findOne({
      where: { payment_id: paymentId }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'Payment already processed' });
    }
    
    // Get merchant branding
    const branding = await Branding.findOne({
      where: { merchant_id: payment.merchant_id }
    });
    
    const response = {
      payment_id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      merchant_id: payment.merchant_id,
      branding: branding ? {
        logo_url: branding.logo_url,
        primary_color: branding.primary_color,
        accent_color: branding.accent_color,
        background_color: branding.background_color,
        text_color: branding.text_color,
        button_text_color: branding.button_text_color,
        font_family: branding.font_family,
        border_radius: branding.border_radius,
        show_powered_by: branding.show_powered_by
      } : {
        primary_color: '#6366F1',
        accent_color: '#4F46E5',
        background_color: '#F9FAFB',
        text_color: '#111827',
        button_text_color: '#FFFFFF',
        font_family: 'Inter, system-ui, sans-serif',
        border_radius: '0.5rem',
        show_powered_by: true
      }
    };
    
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.submitPayment = async (req, res) => {
  try {
    console.log('[SUBMIT] ===== START SUBMIT PAYMENT =====');
    console.log('[SUBMIT] Request body:', req.body);
    
    const { payment_id, card_number, expiry, cvv, otp } = req.body;
    
    if (!payment_id || !card_number || !expiry || !cvv) {
      console.log('[SUBMIT] Missing required fields');
      return res.status(400).json({ message: 'All payment details are required' });
    }
    
    console.log(`[SUBMIT] Looking for payment with ID: ${payment_id}`);
    
    // Cari payment berdasarkan payment_id (UUID)
    const payment = await Payment.findOne({
      where: { payment_id: payment_id }
    });
    
    if (!payment) {
      console.log('[SUBMIT] Payment not found in database');
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    console.log('[SUBMIT] Payment found:', {
      id: payment.id,
      payment_id: payment.payment_id,
      status: payment.status,
      amount: payment.amount,
      merchant_id: payment.merchant_id
    });
    
    // Cek status - hanya 'pending' yang boleh diproses
    if (payment.status !== 'pending') {
      console.log(`[SUBMIT] Invalid status: ${payment.status}, expected 'pending'`);
      return res.status(400).json({ message: 'Payment already processed' });
    }
    
    // Tentukan status berdasarkan kartu
    let status;
    console.log(`[SUBMIT] Processing card: ${card_number.substring(0,4)}...${card_number.substring(12)}`);
    
    const customOutcome = await testCardController.getCardOutcome(card_number);
    
    if (customOutcome) {
      status = customOutcome;
      console.log(`[SUBMIT] Custom outcome: ${status}`);
    } else if (card_number === '4111111111111111') {
      status = 'success';
      console.log('[SUBMIT] Success card detected');
    } else if (card_number === '5500000000000004') {
      status = 'failed';
      console.log('[SUBMIT] Failed card detected');
    } else {
      const lastDigit = parseInt(card_number.slice(-1));
      status = lastDigit % 2 === 0 ? 'success' : 'failed';
      console.log(`[SUBMIT] Random outcome based on last digit: ${status}`);
    }
    
    // UPDATE STATUS PAYMENT
    console.log(`[SUBMIT] Updating payment status from '${payment.status}' to '${status}'`);
    
    try {
      payment.status = status;
      await payment.save();
      console.log('[SUBMIT] Payment saved successfully');
    } catch (saveError) {
      console.error('[SUBMIT] Error saving payment:', saveError.message);
      console.error(saveError);
      return res.status(500).json({ message: 'Database error', error: saveError.message });
    }
    
    // ===== Webhook dimatikan sementara =====
    console.log(`[HOSTED] Mengirim webhook untuk payment ${payment_id} dengan status ${status}`);
    try {
      await paymentController.sendWebhook(payment_id, status);
      console.log('[HOSTED] Webhook berhasil dikirim');
    } catch (webhookError) {
      console.error('[HOSTED] Gagal mengirim webhook:', webhookError.message);
      // Webhook gagal, tapi payment tetap sukses
    }
    
    // SIAPKAN RESPONSE
    console.log('[SUBMIT] Preparing response');
    
    const responseData = {
      payment_id: payment.id,
      status: status,
      redirect_url: payment.redirect_url || '/payment-result'
    };
    
    console.log('[SUBMIT] Response data:', responseData);
    console.log('[SUBMIT] ===== END SUBMIT PAYMENT =====');
    
    res.status(200).json(responseData);
    
  } catch (err) {
    console.error('[SUBMIT] UNCAUGHT ERROR:', err);
    console.error(err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};