export async function up(queryInterface, Sequelize) {
  // Create Transcripts table
  await queryInterface.createTable('Transcripts', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    sessionId: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    transcript: {
      type: Sequelize.TEXT('long'), // Supports large strings
      allowNull: false
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE
    },
    aiAccess: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  });

  // Create junction table for many-to-many relationship
  await queryInterface.createTable('TranscriptUsers', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    transcriptId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Transcripts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    userAccountId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'UserAccount', // Reference to your existing UserAccount table
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE
    }
  });

  // Add composite unique constraint to prevent duplicate user-transcript pairs
  await queryInterface.addConstraint('TranscriptUsers', {
    fields: ['transcriptId', 'userAccountId'],
    type: 'unique',
    name: 'unique_transcript_user'
  });

  // Add indexes for faster queries
  await queryInterface.addIndex('TranscriptUsers', ['transcriptId']);
  await queryInterface.addIndex('TranscriptUsers', ['userAccountId']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('TranscriptUsers');
  await queryInterface.dropTable('Transcripts');
}
