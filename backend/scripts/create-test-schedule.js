require('dotenv').config();
const { Schedule } = require('../models');
const sequelize = require('../config/db.config');

async function createTestSchedule() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    const testSchedule = await Schedule.create({
      employeeId: 1, // Make sure this employee exists
      outletId: 1,   // Make sure this outlet exists
      companyId: 1,  // Make sure this company exists
      date: new Date(),
      startTime: '09:00:00',
      endTime: '17:00:00',
      duration: 8.00,
      shiftRate: 10.00,
      createdBy: 1   // Make sure this user exists
    });

    console.log('Test schedule created:', testSchedule.toJSON());
    process.exit(0);
  } catch (error) {
    console.error('Error creating test schedule:', error);
    process.exit(1);
  }
}

createTestSchedule();