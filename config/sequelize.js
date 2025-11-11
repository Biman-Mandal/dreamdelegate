require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      application_name: 'laravel-to-node'
    },
    logging: false
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true'
    },
    logging: false
  }
};