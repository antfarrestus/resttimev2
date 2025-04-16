require('dotenv').config();
const { Employee } = require('../models');
const sequelize = require('../config/db.config');

async function createTestEmployee() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    const testEmployee = await Employee.create({
      firstName: 'Test',
      lastName: 'Employee',
      employeeNumber: 101,
      type: 'Full Time',
      companyId: 1,  // Make sure this company exists
      outletId: 1,   // Make sure this outlet exists
      sectionId: 1,  // Make sure this section exists
      active: true,
      createdBy: 1   // Make sure this user exists
    });

    console.log('Test employee created:', testEmployee.toJSON());
    process.exit(0);
  } catch (error) {
    console.error('Error creating test employee:', error);
    process.exit(1);
  }
}

createTestEmployee();