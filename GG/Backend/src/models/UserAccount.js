import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class UserAccount extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      
    }
  };
  UserAccount.init({
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    loggedIn: DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'UserAccount',
  });

  return UserAccount;
};

export const addUserAccountAssociations = (models) => {
  models.UserAccount.belongsToMany(models.Transcript, {
    through: models.TranscriptUser,
    foreignKey: 'userAccountId',
    otherKey: 'transcriptId',
    as: 'transcripts'
  });

  models.UserAccount.hasMany(models.TranscriptUser, { 
    foreignKey: 'userAccountId' 
  });
};
