const { Sequelize } = require('sequelize');
const config = require('../config/config.js');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: console.log
  }
);

async function addWeekdayShifts() {
  try {
    console.log('Adding weekday shift columns to Employees table...');
    
    // Add mondayShiftId column
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'mondayShiftId'
      )
      BEGIN
        ALTER TABLE Employees ADD mondayShiftId INT NULL;
        ALTER TABLE Employees ADD CONSTRAINT FK_Employees_Monday_Shifts 
        FOREIGN KEY (mondayShiftId) REFERENCES Shifts(id) ON DELETE SET NULL ON UPDATE CASCADE;
      END
    `);
    
    // Add tuesdayShiftId column
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'tuesdayShiftId'
      )
      BEGIN
        ALTER TABLE Employees ADD tuesdayShiftId INT NULL;
        ALTER TABLE Employees ADD CONSTRAINT FK_Employees_Tuesday_Shifts 
        FOREIGN KEY (tuesdayShiftId) REFERENCES Shifts(id) ON DELETE SET NULL ON UPDATE CASCADE;
      END
    `);
    
    // Add wednesdayShiftId column
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'wednesdayShiftId'
      )
      BEGIN
        ALTER TABLE Employees ADD wednesdayShiftId INT NULL;
        ALTER TABLE Employees ADD CONSTRAINT FK_Employees_Wednesday_Shifts 
        FOREIGN KEY (wednesdayShiftId) REFERENCES Shifts(id) ON DELETE SET NULL ON UPDATE CASCADE;
      END
    `);
    
    // Add thursdayShiftId column
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'thursdayShiftId'
      )
      BEGIN
        ALTER TABLE Employees ADD thursdayShiftId INT NULL;
        ALTER TABLE Employees ADD CONSTRAINT FK_Employees_Thursday_Shifts 
        FOREIGN KEY (thursdayShiftId) REFERENCES Shifts(id) ON DELETE SET NULL ON UPDATE CASCADE;
      END
    `);
    
    // Add fridayShiftId column
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'fridayShiftId'
      )
      BEGIN
        ALTER TABLE Employees ADD fridayShiftId INT NULL;
        ALTER TABLE Employees ADD CONSTRAINT FK_Employees_Friday_Shifts 
        FOREIGN KEY (fridayShiftId) REFERENCES Shifts(id) ON DELETE SET NULL ON UPDATE CASCADE;
      END
    `);
    
    // Add saturdayShiftId column
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'saturdayShiftId'
      )
      BEGIN
        ALTER TABLE Employees ADD saturdayShiftId INT NULL;
        ALTER TABLE Employees ADD CONSTRAINT FK_Employees_Saturday_Shifts 
        FOREIGN KEY (saturdayShiftId) REFERENCES Shifts(id) ON DELETE SET NULL ON UPDATE CASCADE;
      END
    `);
    
    // Add sundayShiftId column
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'sundayShiftId'
      )
      BEGIN
        ALTER TABLE Employees ADD sundayShiftId INT NULL;
        ALTER TABLE Employees ADD CONSTRAINT FK_Employees_Sunday_Shifts 
        FOREIGN KEY (sundayShiftId) REFERENCES Shifts(id) ON DELETE SET NULL ON UPDATE CASCADE;
      END
    `);
    
    console.log('Successfully added weekday shift columns to Employees table');
  } catch (error) {
    console.error('Error adding weekday shift columns:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the function
addWeekdayShifts();