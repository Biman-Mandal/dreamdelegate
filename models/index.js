'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const db = {};

// Get connection string from env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL not found in .env file!");
  process.exit(1);
}

console.log("🔄 Attempting to connect to the database...");
console.log(`🔗 Using connection string: ${connectionString.split('@')[1]}`); // Hide password for safety

// Initialize Sequelize
const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: false
});

// Test connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully!");
    await sequelize.sync({ alter: true }); // create tables if missing
    console.log("✅ Tables synced successfully!");
  } catch (error) {
    console.error("❌ Database connection/sync failed:", error);
  }
})();

// Import models dynamically
fs.readdirSync(__dirname)
  .filter(file => file.indexOf('.') !== 0 && file !== 'index.js' && file.slice(-3) === '.js')
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Setup associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) db[modelName].associate(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
