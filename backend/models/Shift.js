const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Shift = sequelize.define('Shift', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  isOpenShift: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  duration: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false
  },
  break1start: {
    type: DataTypes.TIME,
    allowNull: true
  },
  break1end: {
    type: DataTypes.TIME,
    allowNull: true
  },
  break1duration: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true
  },
  break1paid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  break2start: {
    type: DataTypes.TIME,
    allowNull: true
  },
  break2end: {
    type: DataTypes.TIME,
    allowNull: true
  },
  break2duration: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true
  },
  break2paid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  break3start: {
    type: DataTypes.TIME,
    allowNull: true
  },
  break3end: {
    type: DataTypes.TIME,
    allowNull: true
  },
  break3duration: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true
  },
  break3paid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  shiftRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Using CompanyId instead of companyId to match Sequelize's association naming
  CompanyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Companies',
      key: 'id'
    }
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Shift;