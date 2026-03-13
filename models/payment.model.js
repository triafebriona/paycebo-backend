module.exports = (sequelize, Sequelize) => {
  const Payment = sequelize.define('payment', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true            
    },
    payment_id: {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true
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
      defaultValue: 'IDR'           
    },
    status: {
      type: Sequelize.ENUM('created', 'success', 'failed', 'declined', 'insufficient_funds', 'expired_card', 'processing', 'timeout'),
      defaultValue: 'created'
    },
    redirect_url: {
      type: Sequelize.STRING,
      allowNull: false
    },
    merchant_reference: {          
      type: Sequelize.STRING,
      allowNull: true
    },
    webhook_sent: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return Payment;
};