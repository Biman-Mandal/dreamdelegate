// tools/sync-db.js
/**
 * CLI tool to run seeders:
 * node src/tools/seed-db.js
 *
 * Make sure your DB is reachable and models are initialized.
 */
const { sequelize } = require('../models');
const { runSeeders } = require('../seeders/runSeeders');

(async () => {
  try {
    console.log('Connecting to DB...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    console.log('Syncing model definitions (no destructive changes)...');
    // Create missing tables and update columns safely.
    await sequelize.sync({ alter: true });

    console.log('Running seeders...');
    const result = await runSeeders();
    console.log('Seeders completed:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Seeder failed:', err);
    process.exit(1);
  }
})();