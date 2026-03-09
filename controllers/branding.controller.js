const db = require('../models');
const Branding = db.brandings;

exports.getBranding = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    
    let branding = await Branding.findOne({
      where: { merchant_id: merchantId }
    });
    
    if (!branding) {
      branding = await Branding.create({
        merchant_id: merchantId
      });
    }
    
    res.status(200).json(branding);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateBranding = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const {
      logo_url,
      primary_color,
      accent_color,
      background_color,
      text_color,
      button_text_color,
      font_family,
      border_radius,
      show_powered_by
    } = req.body;
    
    let branding = await Branding.findOne({
      where: { merchant_id: merchantId }
    });
    
    if (!branding) {
      branding = await Branding.create({
        merchant_id: merchantId,
        logo_url,
        primary_color,
        accent_color,
        background_color,
        text_color,
        button_text_color,
        font_family,
        border_radius,
        show_powered_by
      });
    } else {
      if (logo_url !== undefined) branding.logo_url = logo_url;
      if (primary_color !== undefined) branding.primary_color = primary_color;
      if (accent_color !== undefined) branding.accent_color = accent_color;
      if (background_color !== undefined) branding.background_color = background_color;
      if (text_color !== undefined) branding.text_color = text_color;
      if (button_text_color !== undefined) branding.button_text_color = button_text_color;
      if (font_family !== undefined) branding.font_family = font_family;
      if (border_radius !== undefined) branding.border_radius = border_radius;
      if (show_powered_by !== undefined) branding.show_powered_by = show_powered_by;
      
      await branding.save();
    }
    
    res.status(200).json({
      message: 'Branding updated successfully',
      branding
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getPaymentPageBranding = async (req, res) => {
  try {
    const { merchantId } = req.params;
    
    if (!merchantId) {
      return res.status(400).json({ message: 'Merchant ID is required' });
    }
    
    let branding = await Branding.findOne({
      where: { merchant_id: merchantId }
    });
    
    if (!branding) {
      return res.status(200).json({
        primary_color: '#6366F1',
        accent_color: '#4F46E5',
        background_color: '#F9FAFB',
        text_color: '#111827',
        button_text_color: '#FFFFFF',
        font_family: 'Inter, system-ui, sans-serif',
        border_radius: '0.5rem',
        show_powered_by: true
      });
    }
    
    res.status(200).json({
      logo_url: branding.logo_url,
      primary_color: branding.primary_color,
      accent_color: branding.accent_color,
      background_color: branding.background_color,
      text_color: branding.text_color,
      button_text_color: branding.button_text_color,
      font_family: branding.font_family,
      border_radius: branding.border_radius,
      show_powered_by: branding.show_powered_by
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};