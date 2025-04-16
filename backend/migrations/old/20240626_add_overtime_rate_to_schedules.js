'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Schedules', 'overtimeRate', {
      type: Sequelize.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 1.00
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Schedules', 'overtimeRate');
  }
};