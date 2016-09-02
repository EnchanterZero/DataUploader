/**
 * id
 * key
 * value
 *
 * @param sequelize
 * @param DataTypes
 * @returns {Model}
 */
export function create(sequelize, DataTypes) {
  const Config = sequelize.define('Config', {
    id: {
      type: DataTypes.UUID,
      validate: {
        isLowercase: true
      },
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
      defaultValue: '',
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING,
      defaultValue: '',
      allowNull: false,
    },
  }, {
    charset: 'utf8',
    collate: 'utf8_general_ci',
    indexes: [
      {
        fields: ['key'],
        unique: true,
      },
    ],
    classMethods: {
      associate: function (models) {
        // associations can be defined here
      }
    }
  });
  Config.sync()
  .then(()=> {
    return Config.findOrCreate({
      where: {
        key: 'GenoServerUrl',
      },
      defaults: {
        key: 'GenoServerUrl',
        value: 'https://api-geno-s03.curacloudplatform.com:443'
      }});
  })
  return Config;
};