/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    // Add the new default_time_zone column
    await queryInterface.addColumn('UserProfile', 'default_time_zone', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'UTC'
    });

    // Remove the old availability columns
    await queryInterface.removeColumn('UserProfile', 'dates_available');
    await queryInterface.removeColumn('UserProfile', 'times_available');
  },

  async down(queryInterface, Sequelize) {
    // Remove the new default_time_zone column
    await queryInterface.removeColumn('UserProfile', 'default_time_zone');

    // Add back the old availability columns
    await queryInterface.addColumn('UserProfile', 'dates_available', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('UserProfile', 'times_available', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};
