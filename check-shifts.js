const { Employee } = require('./backend/models');
const sequelize = require('./backend/config/db.config');

async function checkEmployeeShifts() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    const employees = await Employee.findAll({
      attributes: ['id', 'firstName', 'lastName', 'mondayShiftId', 'tuesdayShiftId', 'wednesdayShiftId', 'thursdayShiftId', 'fridayShiftId', 'saturdayShiftId', 'sundayShiftId']
    });
    
    console.log('Found', employees.length, 'employees');
    
    employees.forEach(emp => {
      console.log(`Employee ID: ${emp.id}, Name: ${emp.firstName} ${emp.lastName || ''}`);
      console.log(`  Monday: ${emp.mondayShiftId || 'null'}`);
      console.log(`  Tuesday: ${emp.tuesdayShiftId || 'null'}`);
      console.log(`  Wednesday: ${emp.wednesdayShiftId || 'null'}`);
      console.log(`  Thursday: ${emp.thursdayShiftId || 'null'}`);
      console.log(`  Friday: ${emp.fridayShiftId || 'null'}`);
      console.log(`  Saturday: ${emp.saturdayShiftId || 'null'}`);
      console.log(`  Sunday: ${emp.sundayShiftId || 'null'}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkEmployeeShifts();