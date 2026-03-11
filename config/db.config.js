require('dotenv').config();

const dbConfig = {
  HOST: process.env.DB_HOST || 'localhost',
  USER: process.env.DB_USER || 'root',
  PASSWORD: process.env.DB_PASSWORD || '',
  DB: process.env.DB_NAME || 'paycebo_db',
  port: process.env.DB_PORT || 4000,
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
};

console.log('=== DB CONFIG (VALUE) ===');
console.log('USER:', dbConfig.USER);
console.log('PASSWORD length:', dbConfig.PASSWORD ? dbConfig.PASSWORD.length : 0);
console.log('PASSWORD first char:', dbConfig.PASSWORD ? dbConfig.PASSWORD[0] : 'none');
console.log('PASSWORD last char:', dbConfig.PASSWORD ? dbConfig.PASSWORD[dbConfig.PASSWORD.length - 1] : 'none');
console.log('HOST:', dbConfig.HOST);
console.log('PORT:', dbConfig.port);
console.log('DB:', dbConfig.DB);
console.log('==========================');

module.exports = dbConfig;