require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Create connection without database name
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
    });
    
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'paycebo_db';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName};`);
    console.log(`Database '${dbName}' created or already exists`);
    
    // Close connection
    await connection.end();
    console.log('Database setup completed successfully');
    
    // Run the seed script
    require('./utils/seed');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();