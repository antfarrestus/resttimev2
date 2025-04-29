const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Outlet = sequelize.define('Outlet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // Grace Period fields
  earlyClockInGrace: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  slightlyLateClockInGrace: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lateClockInGrace: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  earlyClockOutGrace: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  slightlyLateClockOutGrace: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lateClockOutGrace: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Daily Rates fields
  mondayShiftRate: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  mondayOvertimeRate: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  tuesdayShiftRate: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  tuesdayOvertimeRate: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  wednesdayShiftRate: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  wednesdayOvertimeRate: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  thursdayShiftRate: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  thursdayOvertimeRate: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  fridayShiftRate: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  fridayOvertimeRate: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  saturdayShiftRate: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  saturdayOvertimeRate: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  sundayShiftRate: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  sundayOvertimeRate: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  holidayShiftRate: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  holidayOvertimeRate: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true
});

module.exports = Outlet;