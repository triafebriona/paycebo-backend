const db = require('../models');
const TestCard = db.testcards;

exports.createTestCard = async (req, res) => {
  try {
    const { card_number, card_type, outcome, description } = req.body;
    const merchantId = req.merchantId;
    
    if (!card_number || !outcome) {
      return res.status(400).json({ message: 'Card number and outcome are required' });
    }
    
    const existingCard = await TestCard.findOne({
      where: { card_number, merchant_id: merchantId }
    });
    
    if (existingCard) {
      return res.status(400).json({ message: 'Card number already exists' });
    }
    
    const testCard = await TestCard.create({
      merchant_id: merchantId,
      card_number,
      card_type: card_type || 'visa',
      outcome,
      description
    });
    
    res.status(201).json({
      message: 'Test card created successfully',
      testCard
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllTestCards = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    
    const testCards = await TestCard.findAll({
      where: { 
        [db.Sequelize.Op.or]: [
          { merchant_id: merchantId },
          { is_global: true }
        ]
      }
    });
    
    res.status(200).json(testCards);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getTestCard = async (req, res) => {
  try {
    const { id } = req.params;
    const merchantId = req.merchantId;
    
    const testCard = await TestCard.findOne({
      where: { 
        id,
        [db.Sequelize.Op.or]: [
          { merchant_id: merchantId },
          { is_global: true }
        ]
      }
    });
    
    if (!testCard) {
      return res.status(404).json({ message: 'Test card not found' });
    }
    
    res.status(200).json(testCard);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateTestCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { card_number, card_type, outcome, description } = req.body;
    const merchantId = req.merchantId;
    
    const testCard = await TestCard.findOne({
      where: { 
        id,
        merchant_id: merchantId
      }
    });
    
    if (!testCard) {
      return res.status(404).json({ message: 'Test card not found or you do not have permission to update it' });
    }
    
    if (card_number) testCard.card_number = card_number;
    if (card_type) testCard.card_type = card_type;
    if (outcome) testCard.outcome = outcome;
    if (description !== undefined) testCard.description = description;
    
    await testCard.save();
    
    res.status(200).json({
      message: 'Test card updated successfully',
      testCard
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteTestCard = async (req, res) => {
  try {
    const { id } = req.params;
    const merchantId = req.merchantId;
    
    const testCard = await TestCard.findOne({
      where: { 
        id,
        merchant_id: merchantId
      }
    });
    
    if (!testCard) {
      return res.status(404).json({ message: 'Test card not found or you do not have permission to delete it' });
    }
    
    await testCard.destroy();
    
    res.status(200).json({
      message: 'Test card deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getCardOutcome = async (card_number) => {
  try {
    const testCard = await TestCard.findOne({
      where: { card_number }
    });
    
    if (testCard) {
      return testCard.outcome;
    }
    
    return null;
  } catch (err) {
    console.error('Error getting card outcome:', err);
    return null;
  }
};