/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    // Add the new zodiac column
    await queryInterface.addColumn('UserProfile', 'zodiac', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Remove the old hobby column
    await queryInterface.removeColumn('UserProfile', 'hobby');
  },

  async down(queryInterface, Sequelize) {
    // Remove the new zodiac column
    await queryInterface.removeColumn('UserProfile', 'zodiac');

    // Add back the old hobby column
    await queryInterface.addColumn('UserProfile', 'hobby', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};
