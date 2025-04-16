'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Schedules', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      employeeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Employees',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      startTime: {
        type: Sequelize.TIME,
        allowNull: false,
        defaultValue: '00:00:00'
      },
      endTime: {
        type: Sequelize.TIME,
        allowNull: false,
        defaultValue: '00:00:00'
      },
      duration: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: false
      },
      shiftRate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      isOpenShift: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      break1start: {
        type: Sequelize.TIME,
        allowNull: false,
        defaultValue: '00:00:00'
      },
      break1end: {
        type: Sequelize.TIME,
        allowNull: false,
        defaultValue: '00:00:00'
      },
      break1duration: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: true
      },
      break1paid: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      break2start: {
        type: Sequelize.TIME,
        allowNull: false,
        defaultValue: '00:00:00'
      },
      break2end: {
        type: Sequelize.TIME,
        allowNull: false,
        defaultValue: '00:00:00'
      },
      break2duration: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: true
      },
      break2paid: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      break3start: {
        type: Sequelize.TIME,
        allowNull: false,
        defaultValue: '00:00:00'
      },
      break3end: {
        type: Sequelize.TIME,
        allowNull: false,
        defaultValue: '00:00:00'
      },
      break3duration: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: true
      },
      break3paid: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Companies',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      outletId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Outlets',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add unique constraint for employeeId and date
    await queryInterface.addIndex('Schedules', ['employeeId', 'date'], {
      unique: true,
      name: 'schedules_employee_date_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Schedules');
  }
};