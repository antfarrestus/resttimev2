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

async function checkWeekdayShifts() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Check if columns exist
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Employees' 
      AND COLUMN_NAME LIKE '%ShiftId'
    `);
    
    console.log('Current weekday shift columns in Employees table:');
    console.table(columns);
    
    // List of weekday columns to check
    const weekdayColumns = [
      'mondayShiftId',
      'tuesdayShiftId',
      'wednesdayShiftId',
      'thursdayShiftId',
      'fridayShiftId',
      'saturdayShiftId',
      'sundayShiftId'
    ];
    
    // Check which columns are missing
    const existingColumns = columns.map(col => col.COLUMN_NAME.toLowerCase());
    const missingColumns = weekdayColumns.filter(col => !existingColumns.includes(col.toLowerCase()));
    
    if (missingColumns.length === 0) {
      console.log('All weekday shift columns already exist in the Employees table.');
    } else {
      console.log(`Missing columns: ${missingColumns.join(', ')}`);
      console.log('Adding missing weekday shift columns to Employees table...');
      
      // Add each missing column one by one
      for (const column of missingColumns) {
        const day = column.replace('ShiftId', '');
        const constraintName = `FK_Employees_${day.charAt(0).toUpperCase() + day.slice(1)}_Shifts`;
        
        try {
          await sequelize.query(`
            ALTER TABLE Employees ADD ${column} INT NULL;
            ALTER TABLE Employees ADD CONSTRAINT ${constraintName} 
            FOREIGN KEY (${column}) REFERENCES Shifts(id) ON DELETE SET NULL ON UPDATE CASCADE;
          `);
          console.log(`Added ${column} column successfully`);
        } catch (error) {
          console.error(`Error adding ${column}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run the function
checkWeekdayShifts();