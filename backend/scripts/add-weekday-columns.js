const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance with explicit connection parameters from .env
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_SERVER,
    dialect: 'mssql',
    dialectOptions: {
      options: {
        encrypt: true,
        trustServerCertificate: true,
        instanceName: process.env.DB_INSTANCE
      }
    },
    logging: console.log
  }
);

async function addWeekdayColumns() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // List of weekday columns to add
    const weekdayColumns = [
      'mondayShiftId',
      'tuesdayShiftId',
      'wednesdayShiftId',
      'thursdayShiftId',
      'fridayShiftId',
      'saturdayShiftId',
      'sundayShiftId'
    ];
    
    // Add each column one by one without foreign key constraints
    for (const column of weekdayColumns) {
      try {
        await sequelize.query(`
          IF NOT EXISTS (
            SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = '${column}'
          )
          BEGIN
            ALTER TABLE Employees ADD ${column} INT NULL;
            PRINT 'Added ${column} column';
          END
          ELSE
          BEGIN
            PRINT '${column} column already exists';
          END
        `);
        console.log(`Processed ${column} column`);
      } catch (error) {
        console.error(`Error processing ${column}:`, error.message);
      }
    }
    
    // Check which columns were successfully added
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Employees' 
      AND COLUMN_NAME LIKE '%ShiftId'
    `);
    
    console.log('Current weekday shift columns in Employees table:');
    console.table(columns);
    
    console.log('Successfully processed weekday shift columns');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run the function
addWeekdayColumns();