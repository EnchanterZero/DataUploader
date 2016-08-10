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
  const Status = sequelize.define('Status', {
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
  Status.sync()
  .then(()=> {
    return Status.findOrCreate({
      where: {
        key: 'ManualUpload',
      },
      defaults: {
        key: 'ManualUpload',
        value: ''
      }});
  })
  .then(()=> {
    return Status.findOrCreate({
      where: {
        key: 'AutoScanUpload',
      },
      defaults: {
        key: 'AutoScanUpload',
        value: ''
      }});
  })
  .then(()=> {
    return Status.findOrCreate({
      where: {
        key: 'AutoPushUpload',
      },
      defaults: {
        key: 'AutoPushUpload',
        value: ''
      }});
  });
  return Status;
};