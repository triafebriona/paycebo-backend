const jwt = require('jsonwebtoken');
const db = require('../models');
const Merchant = db.merchants;

exports.verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
    const merchant = await Merchant.findByPk(decoded.id);
    
    if (!merchant) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    
    req.merchantId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

exports.verifyApiKey = async (req, res, next) => {
  // Check if Authorization header exists
  if (!req.headers.authorization) {
    return res.status(403).json({ 
      message: 'Authentication required', 
      details: 'Authorization header is missing'
    });
  }
  
  // Check if it has the correct format
  const parts = req.headers.authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(403).json({ 
      message: 'Authentication required', 
      details: 'Authorization header must be in format: Bearer YOUR_TOKEN_OR_API_KEY'
    });
  }
  
  const token = parts[1];
  if (!token) {
    return res.status(403).json({ 
      message: 'Authentication required', 
      details: 'Token or API key value is missing'
    });
  }

  try {
    // First try to verify as a JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
      const merchant = await Merchant.findByPk(decoded.id);
      
      if (merchant) {
        req.merchantId = merchant.id;
        return next();
      }
    } catch (jwtError) {
      // Not a valid JWT, continue to try as API key
    }
    
    // If not a valid JWT, try as an API key
    const merchant = await Merchant.findOne({ where: { api_key: token } });
    
    if (!merchant) {
      return res.status(403).json({ 
        message: 'Authentication failed', 
        details: 'Invalid token or API key'
      });
    }
    
    req.merchantId = merchant.id;
    next();
  } catch (err) {
    return res.status(500).json({ 
      message: 'Server error', 
      details: err.message 
    });
  }
};