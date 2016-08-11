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
        key: 'PACSProvider',
      },
      defaults: {
        key: 'PACSProvider',
        value: ''
      }});
  })
  .then(()=> {
    return Config.findOrCreate({
      where: {
        key: 'PACSServerIP',
      },
      defaults: {
        key: 'PACSServerIP',
        value: '127.0.0.1'
      }});
  })
  .then(()=> {
    return Config.findOrCreate({
      where: {
        key: 'PACSServerPort',
      },
      defaults: {
        key: 'PACSServerPort',
        value: '11112'
      }});
  })
  .then(()=> {
    return Config.findOrCreate({
      where: {
        key: 'ScanInterval',
      },
      defaults: {
        key: 'ScanInterval',
        value: '5000'
      }});
  })
  .then(()=> {
    return Config.findOrCreate({
      where: {
        key: 'UserValidateURL',
      },
      defaults: {
        key: 'UserValidateURL',
        value: '127.0.0.1'
      }});
  })
  .then(()=> {
    return Config.findOrCreate({
      where: {
        key: 'AnonymousMode',
      },
      defaults: {
        key: 'AnonymousMode',
        value: '0'
      }});
  }).then(()=> {
    return Config.findOrCreate({
      where: {
        key: 'UploadDir',
      },
      defaults: {
        key: 'UploadDir',
        value: ''
      }});
  }).then(()=> {
    return Config.findOrCreate({
      where: {
        key: 'ScanDir',
      },
      defaults: {
        key: 'ScanDir',
        value: ''
      }});
  });
  return Config;
};