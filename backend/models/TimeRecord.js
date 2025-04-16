const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const TimeRecord = sequelize.define('TimeRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  deviceId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  clockInTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  clockOutTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  breakStartTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  breakEndTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  totalHours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'clocked-in',
    validate: {
      isIn: [['clocked-in', 'on-break', 'clocked-out']]
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  outletId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = TimeRecord;