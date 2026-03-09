module.exports = (sequelize, Sequelize) => {
  const Webhook = sequelize.define('webhook', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    merchant_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      unique: true
    },
    url: {
      type: Sequelize.STRING,
      allowNull: false
    }
  });
  
  return Webhook;
};