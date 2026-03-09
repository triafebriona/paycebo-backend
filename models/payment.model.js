module.exports = (sequelize, Sequelize) => {
  const Payment = sequelize.define('payment', {
    id: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    merchant_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'INR'
    },
    status: {
      type: Sequelize.ENUM('created', 'success', 'failed', 'declined', 'insufficient_funds', 'expired_card', 'processing', 'timeout'),
      defaultValue: 'created'
    },
    redirect_url: {
      type: Sequelize.STRING,
      allowNull: false
    },
    webhook_sent: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    }
  });
  
  return Payment;
};