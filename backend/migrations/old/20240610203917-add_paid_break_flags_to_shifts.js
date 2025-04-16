'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add paid break flags for each break
    await queryInterface.addColumn('Shifts', 'break1paid', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
    
    await queryInterface.addColumn('Shifts', 'break2paid', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
    
    await queryInterface.addColumn('Shifts', 'break3paid', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove the columns when rolling back
    await queryInterface.removeColumn('Shifts', 'break1paid');
    await queryInterface.removeColumn('Shifts', 'break2paid');
    await queryInterface.removeColumn('Shifts', 'break3paid');
  }
};
