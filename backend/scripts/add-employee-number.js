const sequelize = require('../config/db.config');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Add employeeNumber column to Employees table
    await sequelize.query('ALTER TABLE Employees ADD employeeNumber INT NULL');
    console.log('Successfully added employeeNumber column to Employees table.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();