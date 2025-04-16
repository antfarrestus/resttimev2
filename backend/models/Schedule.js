const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const Employee = require('./Employee');

const Schedule = sequelize.define('Schedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Employees',
      key: 'id'
    }
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Companies',
      key: 'id'
    }
  },
  outletId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Outlets',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
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
  duration: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    defaultValue: 8.00
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true
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
    allowNull: false,
    defaultValue: 0.00
  },
  overtimeRate: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    defaultValue: 1.00
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

Schedule.belongsTo(Employee, { foreignKey: 'employeeId' });

module.exports = Schedule;