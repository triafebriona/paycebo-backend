const dbConfig = require('../config/db.config');
const Sequelize = require('sequelize');

const sequelize = new Sequelize(
  dbConfig.DB,
  dbConfig.USER,
  dbConfig.PASSWORD,
  {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.merchants = require('./merchant.model')(sequelize, Sequelize);
db.payments = require('./payment.model')(sequelize, Sequelize);
db.webhooks = require('./webhook.model')(sequelize, Sequelize);
db.testcards = require('./testcard.model')(sequelize, Sequelize);
db.webhooklogs = require('./webhooklog.model')(sequelize, Sequelize);
db.brandings = require('./branding.model')(sequelize, Sequelize);

db.merchants.hasMany(db.payments, { foreignKey: 'merchant_id' });
db.payments.belongsTo(db.merchants, { foreignKey: 'merchant_id' });

db.merchants.hasOne(db.webhooks, { foreignKey: 'merchant_id' });
db.webhooks.belongsTo(db.merchants, { foreignKey: 'merchant_id' });

db.merchants.hasMany(db.testcards, { foreignKey: 'merchant_id' });
db.testcards.belongsTo(db.merchants, { foreignKey: 'merchant_id' });

db.merchants.hasMany(db.webhooklogs, { foreignKey: 'merchant_id' });
db.webhooklogs.belongsTo(db.merchants, { foreignKey: 'merchant_id' });

db.webhooks.hasMany(db.webhooklogs, { foreignKey: 'webhook_id' });
db.webhooklogs.belongsTo(db.webhooks, { foreignKey: 'webhook_id' });

db.payments.hasMany(db.webhooklogs, { foreignKey: 'payment_id', sourceKey: 'id' });
db.webhooklogs.belongsTo(db.payments, { foreignKey: 'payment_id', targetKey: 'id' });

db.merchants.hasOne(db.brandings, { foreignKey: 'merchant_id' });
db.brandings.belongsTo(db.merchants, { foreignKey: 'merchant_id' });

module.exports = db;