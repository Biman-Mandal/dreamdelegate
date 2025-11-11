// config/database.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;
const useDirect = process.env.USE_DIRECT === 'true';

const sequelize = new Sequelize(useDirect && directUrl ? directUrl : databaseUrl, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false,
  dialectOptions: {
    ...(process.env.DB_SSL === 'true'
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {}),
  },
});

// ✅ Test database connection
(async () => {
  try {
    console.log('Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
})();

// ⚠️ Note:
// Do NOT run sequelize.sync() here.
// Only export the instance for use in models and scripts.

module.exports = sequelize;
