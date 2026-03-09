require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');
const Merchant = db.merchants;
const Payment = db.payments;
const Webhook = db.webhooks;
const TestCard = db.testcards;

async function seedDatabase() {
  try {
    // Create database tables
    console.log('Creating database tables...');
    await db.sequelize.sync({ force: true });
    console.log('Database tables created successfully');
    
    // Create test merchant
    console.log('Creating test merchant...');
    const hashedPassword = await bcrypt.hash('test123', 10);
    const apiKey = uuidv4();
    
    const testMerchant = await Merchant.create({
      name: 'Test Merchant',
      email: 'test@example.com',
      password_hash: hashedPassword,
      api_key: apiKey
    });
    
    // Create test webhook
    console.log('Creating test webhook...');
    await Webhook.create({
      merchant_id: testMerchant.id,
      url: 'https://webhook.site/your-test-webhook-id'
    });
    
    // Create sample payments
    console.log('Creating sample payments...');
    const paymentStatuses = [
      'success', 'success', 'success', 'success', 'success', 'success', // 60% success
      'failed', 'failed', 'failed', // 30% failed
      'declined', // 10% other statuses
      'insufficient_funds',
      'expired_card',
      'processing',
      'timeout'
    ];
    const currencies = ['INR', 'USD', 'EUR'];
    
    // Create dates for the last 30 days
    const now = new Date();
    const dates = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    
    // Create 50 sample payments with different statuses and dates
    for (let i = 0; i < 50; i++) {
      const statusIndex = Math.floor(Math.random() * paymentStatuses.length);
      const status = paymentStatuses[statusIndex];
      const currency = currencies[i % 3];
      
      // Generate amounts in different ranges
      let amount;
      const range = Math.random();
      if (range < 0.3) {
        amount = Math.floor(Math.random() * 100) + 1; // 1-100
      } else if (range < 0.6) {
        amount = Math.floor(Math.random() * 400) + 100; // 100-500
      } else if (range < 0.8) {
        amount = Math.floor(Math.random() * 500) + 500; // 500-1000
      } else if (range < 0.95) {
        amount = Math.floor(Math.random() * 4000) + 1000; // 1000-5000
      } else {
        amount = Math.floor(Math.random() * 5000) + 5000; // 5000-10000
      }
      
      // Select a random date from the last 30 days
      const createdAt = dates[Math.floor(Math.random() * dates.length)];
      
      await Payment.create({
        id: uuidv4(),
        merchant_id: testMerchant.id,
        amount: amount,
        currency: currency,
        status: status,
        redirect_url: 'http://localhost:3000/payment-result',
        webhook_sent: status !== 'created',
        createdAt: createdAt,
        updatedAt: createdAt
      });
    }
    
    // Create default test cards
    console.log('Creating default test cards...');
    const testCards = [
      {
        card_number: '4111111111111111',
        card_type: 'visa',
        outcome: 'success',
        description: 'Default success card',
        is_global: true
      },
      {
        card_number: '5500000000000004',
        card_type: 'mastercard',
        outcome: 'failed',
        description: 'Default failure card',
        is_global: true
      },
      {
        card_number: '4242424242424242',
        card_type: 'visa',
        outcome: 'success',
        description: 'Always succeeds',
        is_global: true
      },
      {
        card_number: '4000000000000002',
        card_type: 'visa',
        outcome: 'declined',
        description: 'Card declined',
        is_global: true
      },
      {
        card_number: '4000000000009995',
        card_type: 'visa',
        outcome: 'insufficient_funds',
        description: 'Insufficient funds',
        is_global: true
      },
      {
        card_number: '4000000000000069',
        card_type: 'visa',
        outcome: 'expired_card',
        description: 'Expired card',
        is_global: true
      },
      {
        card_number: '4000000000000077',
        card_type: 'visa',
        outcome: 'processing',
        description: 'Processing (delayed)',
        is_global: true
      },
      {
        card_number: '4000000000000085',
        card_type: 'visa',
        outcome: 'timeout',
        description: 'Network timeout',
        is_global: true
      }
    ];
    
    for (const card of testCards) {
      await TestCard.create({
        merchant_id: testMerchant.id,
        ...card
      });
    }
    
    console.log('==============================================');
    console.log('🎉 Database seeding completed successfully! 🎉');
    console.log('==============================================');
    console.log('\n==============================================');
    console.log('🔑 TEST MERCHANT CREDENTIALS 🔑');
    console.log('==============================================');
    console.log('Email:    test@example.com');
    console.log('Password: test123');
    console.log('\n📋 API KEY (COPY THIS FOR TESTING): 📋');
    console.log('----------------------------------------------');
    console.log(apiKey);
    console.log('----------------------------------------------');
    console.log('\n⚠️ IMPORTANT: When using the API key, include "Bearer " prefix in the Authorization header ⚠️');
    console.log('\nDatabase tables created:');
    console.log('----------------------');
    console.log('✅ merchants');
    console.log('✅ payments');
    console.log('✅ webhooks');
    console.log('\nSample data:');
    console.log('------------');
    console.log('✅ 1 merchant');
    console.log('✅ 1 webhook');
    console.log('✅ 50 payments (with various statuses and dates)');
    console.log('✅ 8 test cards (with different outcomes)');
    console.log('\nYou can now start the application with:');
    console.log('npm run dev');
    console.log('==============================================');
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Database seeding failed:');
    console.error(err);
    process.exit(1);
  }
}

seedDatabase();