const { User } = require('../models');
const sequelize = require('../config/db.config');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Delete all users
    const deletedCount = await User.destroy({
      where: {},
      force: true // This will perform a hard delete
    });

    console.log(`Deleted ${deletedCount} users from the database.`);

    // Create super admin user
    await User.create({
      username: 'admin',
      password: 'password',
      role: 'super_admin',
      active: true
    });

    console.log('Super admin user recreated successfully.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();