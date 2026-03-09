module.exports = (sequelize, Sequelize) => {
  const WebhookLog = sequelize.define('webhooklog', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    merchant_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    payment_id: {
      type: Sequelize.STRING,
      allowNull: false
    },
    webhook_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    url: {
      type: Sequelize.STRING,
      allowNull: false
    },
    status_code: {
      type: Sequelize.INTEGER
    },
    request_body: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    response_body: {
      type: Sequelize.TEXT
    },
    success: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    error_message: {
      type: Sequelize.TEXT
    },
    retry_count: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    }
  });
  
  return WebhookLog;
};