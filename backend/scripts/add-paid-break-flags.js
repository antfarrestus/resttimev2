'use strict';

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance using environment variables directly
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

async function addPaidBreakFlags() {
  try {
    console.log('Adding paid break flags to Shifts table...');
    
    // Add break1paid column
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Shifts' AND COLUMN_NAME = 'break1paid'
      )
      BEGIN
        ALTER TABLE Shifts ADD break1paid BIT NOT NULL DEFAULT 0;
      END
    `);
    
    // Add break2paid column
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Shifts' AND COLUMN_NAME = 'break2paid'
      )
      BEGIN
        ALTER TABLE Shifts ADD break2paid BIT NOT NULL DEFAULT 0;
      END
    `);
    
    // Add break3paid column
    await sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Shifts' AND COLUMN_NAME = 'break3paid'
      )
      BEGIN
        ALTER TABLE Shifts ADD break3paid BIT NOT NULL DEFAULT 0;
      END
    `);
    
    console.log('Successfully added paid break flags to Shifts table');
  } catch (error) {
    console.error('Error adding paid break flags:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the function
addPaidBreakFlags();