const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log(process.env.DB_NAME);
console.log(process.env.DB_USER);
console.log(process.env.DB_PASSWORD)
console.log(process.env.DB_SERVER)
console.log(process.env.DB_PORT)
console.log(process.env.DB_INSTANCE)

const sequelize = new Sequelize(`${process.env.DB_NAME}`, `${process.env.DB_USER}`, `${process.env.DB_PASSWORD}`, {
  host: `${process.env.DB_SERVER}`,
  port: `${process.env.DB_PORT}`,
  dialect: 'mssql',
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  dialectOptions: {
    options: {
      encrypt: true,
      trustServerCertificate: true,
    }
  },
  logging: console.log
});

module.exports = sequelize;