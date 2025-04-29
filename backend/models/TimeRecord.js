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
    field: 'employeeid',
    allowNull: false
  },
  deviceId: {
    type: DataTypes.INTEGER,
    field: 'deviceid',
    allowNull: false
  },
  outletId: {
    type: DataTypes.INTEGER,
    field: 'outletid',
    allowNull: false
  },
  companyId: {
    type: DataTypes.INTEGER,
    field: 'companyid',
    allowNull: false
  },
  clockType: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  clockInTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  clockInNote: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  clockOutTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  clockOutNote: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  breakStartTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  breakStartNote: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  breakEndTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  breakEndNote: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  break2StartTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  break2StartNote: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  break2EndTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  break2EndNote: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  break3StartTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  break3StartNote: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  break3EndTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  break3EndNote: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  duration: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  img1: {
    type: DataTypes.STRING(300),
    allowNull: true
  },
  img2: {
    type: DataTypes.STRING(300),
    allowNull: true
  },
  img3: {
    type: DataTypes.STRING(300),
    allowNull: true
  },
  img4: {
    type: DataTypes.STRING(300),
    allowNull: true
  },
  img5: {
    type: DataTypes.STRING(300),
    allowNull: true
  },
  img6: {
    type: DataTypes.STRING(300),
    allowNull: true
  },
  img7: {
    type: DataTypes.STRING(300),
    allowNull: true
  },
  img8: {
    type: DataTypes.STRING(300),
    allowNull: true
  }

}, {
  timestamps: true
});

module.exports = TimeRecord;