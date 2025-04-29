// Script to run the migration for adding grace periods and daily rates to outlets
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Get database configuration
const sequelize = require('../config/db.config');

// Function to run the migration
async function runMigration() {
  try {
    console.log('Starting migration: Adding Grace Periods and Daily Rates to Outlets');
    
    // Add Grace Period fields
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'earlyClockInGrace'
      )
      BEGIN
        ALTER TABLE Outlets ADD earlyClockInGrace INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'slightlyLateClockInGrace'
      )
      BEGIN
        ALTER TABLE Outlets ADD slightlyLateClockInGrace INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'lateClockInGrace'
      )
      BEGIN
        ALTER TABLE Outlets ADD lateClockInGrace INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'earlyClockOutGrace'
      )
      BEGIN
        ALTER TABLE Outlets ADD earlyClockOutGrace INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'slightlyLateClockOutGrace'
      )
      BEGIN
        ALTER TABLE Outlets ADD slightlyLateClockOutGrace INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'lateClockOutGrace'
      )
      BEGIN
        ALTER TABLE Outlets ADD lateClockOutGrace INTEGER DEFAULT 0;
      END
    `);
    
    // Add Daily Rates fields
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'mondayShiftRate'
      )
      BEGIN
        ALTER TABLE Outlets ADD mondayShiftRate INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'mondayOvertimeRate'
      )
      BEGIN
        ALTER TABLE Outlets ADD mondayOvertimeRate INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'tuesdayShiftRate'
      )
      BEGIN
        ALTER TABLE Outlets ADD tuesdayShiftRate INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'tuesdayOvertimeRate'
      )
      BEGIN
        ALTER TABLE Outlets ADD tuesdayOvertimeRate INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'wednesdayShiftRate'
      )
      BEGIN
        ALTER TABLE Outlets ADD wednesdayShiftRate INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'wednesdayOvertimeRate'
      )
      BEGIN
        ALTER TABLE Outlets ADD wednesdayOvertimeRate INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'thursdayShiftRate'
      )
      BEGIN
        ALTER TABLE Outlets ADD thursdayShiftRate INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'thursdayOvertimeRate'
      )
      BEGIN
        ALTER TABLE Outlets ADD thursdayOvertimeRate INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'fridayShiftRate'
      )
      BEGIN
        ALTER TABLE Outlets ADD fridayShiftRate INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'fridayOvertimeRate'
      )
      BEGIN
        ALTER TABLE Outlets ADD fridayOvertimeRate INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'saturdayShiftRate'
      )
      BEGIN
        ALTER TABLE Outlets ADD saturdayShiftRate INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'saturdayOvertimeRate'
      )
      BEGIN
        ALTER TABLE Outlets ADD saturdayOvertimeRate INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'sundayShiftRate'
      )
      BEGIN
        ALTER TABLE Outlets ADD sundayShiftRate INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'sundayOvertimeRate'
      )
      BEGIN
        ALTER TABLE Outlets ADD sundayOvertimeRate INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'holidayShiftRate'
      )
      BEGIN
        ALTER TABLE Outlets ADD holidayShiftRate INTEGER DEFAULT 0;
      END
    `);
    
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Outlets' AND COLUMN_NAME = 'holidayOvertimeRate'
      )
      BEGIN
        ALTER TABLE Outlets ADD holidayOvertimeRate INTEGER DEFAULT 0;
      END
    `);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

runMigration();