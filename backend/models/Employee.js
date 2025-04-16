const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeNumber: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  arcNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['Full-Time', 'Part-Time']]
    }
  },
  sectionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  outletId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  hourlyPay: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  monthlyPay: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  allowOvertime: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  monthlyHours: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  Note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  payrollNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Weekday shift associations
  mondayShiftId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Shifts',
      key: 'id'
    }
  },
  tuesdayShiftId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Shifts',
      key: 'id'
    }
  },
  wednesdayShiftId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Shifts',
      key: 'id'
    }
  },
  thursdayShiftId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Shifts',
      key: 'id'
    }
  },
  fridayShiftId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Shifts',
      key: 'id'
    }
  },
  saturdayShiftId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Shifts',
      key: 'id'
    }
  },
  sundayShiftId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Shifts',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

module.exports = Employee;