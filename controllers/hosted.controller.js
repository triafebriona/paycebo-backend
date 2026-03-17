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
    const { payment_id, card_number, expiry, cvv, otp } = req.body;
    
    if (!payment_id || !card_number || !expiry || !cvv) {
      return res.status(400).json({ message: 'All payment details are required' });
    }
    
    const payment = await Payment.findOne({
      where: { payment_id: payment_id }
    });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    if (payment.status !== 'created') {
      return res.status(400).json({ message: 'Payment already processed' });
    }
    
    let status;
    
    const customOutcome = await testCardController.getCardOutcome(card_number);
    
    if (customOutcome) {
      status = customOutcome;
    } else if (card_number === '4111111111111111') {
      status = 'success';
    } else if (card_number === '5500000000000004') {
      status = 'failed';
    } else {
      const lastDigit = parseInt(card_number.slice(-1));
      status = lastDigit % 2 === 0 ? 'success' : 'failed';
    }
    
    payment.status = status;
    await payment.save();
    
    paymentController.sendWebhook(payment_id, status);
    
    res.status(200).json({
      payment_id: payment.id,
      status,
      redirect_url: payment.redirect_url
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};