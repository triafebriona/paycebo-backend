const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');
const Merchant = db.merchants;

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    const existingMerchant = await Merchant.findOne({ where: { email } });
    if (existingMerchant) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const apiKey = uuidv4();
    
    const merchant = await Merchant.create({
      name,
      email,
      password_hash: hashedPassword,
      api_key: apiKey
    });
    
    const token = jwt.sign(
      { id: merchant.id },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'Merchant registered successfully',
      token,
      merchant: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        api_key: merchant.api_key
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const merchant = await Merchant.findOne({ where: { email } });
    if (!merchant) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, merchant.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: merchant.id },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      message: 'Login successful',
      token,
      merchant: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        api_key: merchant.api_key
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};