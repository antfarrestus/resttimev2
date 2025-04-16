'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add columns for each day of the week to store shift IDs
    await queryInterface.addColumn('Employees', 'mondayShiftId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Shifts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('Employees', 'tuesdayShiftId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Shifts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('Employees', 'wednesdayShiftId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Shifts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('Employees', 'thursdayShiftId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Shifts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('Employees', 'fridayShiftId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Shifts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('Employees', 'saturdayShiftId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Shifts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('Employees', 'sundayShiftId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Shifts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the columns when rolling back
    await queryInterface.removeColumn('Employees', 'mondayShiftId');
    await queryInterface.removeColumn('Employees', 'tuesdayShiftId');
    await queryInterface.removeColumn('Employees', 'wednesdayShiftId');
    await queryInterface.removeColumn('Employees', 'thursdayShiftId');
    await queryInterface.removeColumn('Employees', 'fridayShiftId');
    await queryInterface.removeColumn('Employees', 'saturdayShiftId');
    await queryInterface.removeColumn('Employees', 'sundayShiftId');
  }
};