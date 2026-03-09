module.exports = (sequelize, Sequelize) => {
  const TestCard = sequelize.define('testcard', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    merchant_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    card_number: {
      type: Sequelize.STRING,
      allowNull: false
    },
    card_type: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'visa'
    },
    outcome: {
      type: Sequelize.ENUM('success', 'failed', 'declined', 'insufficient_funds', 'expired_card', 'processing', 'timeout'),
      defaultValue: 'success'
    },
    description: {
      type: Sequelize.STRING
    },
    is_global: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    }
  });
  
  return TestCard;
};