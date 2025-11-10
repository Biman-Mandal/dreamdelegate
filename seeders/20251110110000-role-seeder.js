'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const password = await bcrypt.hash('Admin@123', 10);

      // Create Admin User (no roleName column)
      const [user] = await queryInterface.bulkInsert(
        'users',
        [
          {
            name: 'Admin User',
            email: 'admin@admin.com',
            phone: '9999999999',
            password,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { returning: ['id'] }
      );

      // Get the Admin role id
      const [roles] = await queryInterface.sequelize.query(
        `SELECT id FROM roles WHERE name = 'admin' LIMIT 1;`
      );

      if (roles.length > 0 && user.id) {
        await queryInterface.bulkInsert('user_roles', [
          {
            user_id: user.id,
            role_id: roles[0].id,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ]);
        console.log('✅ Admin user linked with admin role successfully!');
      } else {
        console.warn('⚠️ Admin role not found or user creation failed.');
      }
    } catch (err) {
      console.error('❌ Error in user seeder:', err);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('user_roles', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
