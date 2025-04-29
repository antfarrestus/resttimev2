'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add Grace Period fields
    await queryInterface.addColumn('Outlets', 'earlyClockInGrace', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'slightlyLateClockInGrace', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'lateClockInGrace', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'earlyClockOutGrace', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'slightlyLateClockOutGrace', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'lateClockOutGrace', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    // Add Daily Rates fields
    await queryInterface.addColumn('Outlets', 'mondayShiftRate', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'mondayOvertimeRate', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'tuesdayShiftRate', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'tuesdayOvertimeRate', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'wednesdayShiftRate', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'wednesdayOvertimeRate', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'thursdayShiftRate', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'thursdayOvertimeRate', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'fridayShiftRate', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'fridayOvertimeRate', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'saturdayShiftRate', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'saturdayOvertimeRate', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'sundayShiftRate', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'sundayOvertimeRate', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'holidayShiftRate', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Outlets', 'holidayOvertimeRate', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove Grace Period fields
    await queryInterface.removeColumn('Outlets', 'earlyClockInGrace');
    await queryInterface.removeColumn('Outlets', 'slightlyLateClockInGrace');
    await queryInterface.removeColumn('Outlets', 'lateClockInGrace');
    await queryInterface.removeColumn('Outlets', 'earlyClockOutGrace');
    await queryInterface.removeColumn('Outlets', 'slightlyLateClockOutGrace');
    await queryInterface.removeColumn('Outlets', 'lateClockOutGrace');
    
    // Remove Daily Rates fields
    await queryInterface.removeColumn('Outlets', 'mondayShiftRate');
    await queryInterface.removeColumn('Outlets', 'mondayOvertimeRate');
    await queryInterface.removeColumn('Outlets', 'tuesdayShiftRate');
    await queryInterface.removeColumn('Outlets', 'tuesdayOvertimeRate');
    await queryInterface.removeColumn('Outlets', 'wednesdayShiftRate');
    await queryInterface.removeColumn('Outlets', 'wednesdayOvertimeRate');
    await queryInterface.removeColumn('Outlets', 'thursdayShiftRate');
    await queryInterface.removeColumn('Outlets', 'thursdayOvertimeRate');
    await queryInterface.removeColumn('Outlets', 'fridayShiftRate');
    await queryInterface.removeColumn('Outlets', 'fridayOvertimeRate');
    await queryInterface.removeColumn('Outlets', 'saturdayShiftRate');
    await queryInterface.removeColumn('Outlets', 'saturdayOvertimeRate');
    await queryInterface.removeColumn('Outlets', 'sundayShiftRate');
    await queryInterface.removeColumn('Outlets', 'sundayOvertimeRate');
    await queryInterface.removeColumn('Outlets', 'holidayShiftRate');
    await queryInterface.removeColumn('Outlets', 'holidayOvertimeRate');
  }
};