// Script to check if grace periods and daily rates columns exist in Outlets table
const sequelize = require('../config/db.config');

async function checkOutletColumns() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Check for grace period columns
    const [graceColumns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Outlets' 
      AND COLUMN_NAME IN (
        'earlyClockInGrace', 'slightlyLateClockInGrace', 'lateClockInGrace',
        'earlyClockOutGrace', 'slightlyLateClockOutGrace', 'lateClockOutGrace'
      )
    `);
    
    console.log('\nGrace period columns found in Outlets table:');
    if (graceColumns.length === 0) {
      console.log('No grace period columns found!');
    } else {
      graceColumns.forEach(col => console.log(`- ${col.COLUMN_NAME}`));
      console.log(`Total grace period columns: ${graceColumns.length} of 6`);
    }
    
    // Check for rate columns
    const [rateColumns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Outlets' 
      AND COLUMN_NAME LIKE '%Rate'
    `);
    
    console.log('\nRate columns found in Outlets table:');
    if (rateColumns.length === 0) {
      console.log('No rate columns found!');
    } else {
      rateColumns.forEach(col => console.log(`- ${col.COLUMN_NAME}`));
      console.log(`Total rate columns: ${rateColumns.length} of 16`);
    }
    
  } catch (error) {
    console.error('Error checking columns:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

checkOutletColumns();