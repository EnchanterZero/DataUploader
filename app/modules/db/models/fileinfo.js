/**
 * name
 * filePath
 * size
 * projectName
 * projectId
 * progress
 * checkPointTime
 * speed
 * checkPoint
 * status   finished | uploading | paused | pausing | aborted
 * fileId
 * syncId
 * userId
 * uploadType
 *
 * @param sequelize
 * @param DataTypes
 * @returns {Model}
 */
export function create(sequelize, DataTypes) {
  const FileInfo = sequelize.define('FileInfo', {
    id: {
      type: DataTypes.UUID,
      validate: {
        isLowercase: true
      },
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      defaultValue: '',
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING,
      defaultValue: '',
      allowNull: false,
    },
    projectName:{
      type: DataTypes.STRING,
      defaultValue: '',
      allowNull: false,
    },
    projectId:{
      type: DataTypes.STRING,
      defaultValue: '',
      allowNull: false,
    },
    size:{
      type: DataTypes.STRING,
      defaultValue: '0',
      allowNull: false,
    },
    progress: {
      type: DataTypes.STRING,
      defaultValue: '0',
      allowNull: false,
    },
    speed:{
      type: DataTypes.STRING,
      defaultValue: '0',
      allowNull: true,
    },
    checkPointTime:{
      type: DataTypes.STRING,
      defaultValue: '0',
      allowNull: true,
    },
    checkPoint: {
      type: DataTypes.STRING,
      defaultValue: '',
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: '',
      allowNull: false,
    },
    fileId: {
      type: DataTypes.STRING,
      defaultValue: '',
      allowNull: false,
    },
    syncId: {
      type: DataTypes.STRING,
      defaultValue: '',
      allowNull: false,
    },
    userId:{
      type: DataTypes.STRING,
      defaultValue: '',
      allowNull: false,
    },
    uploadType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    charset: 'utf8',
    collate: 'utf8_general_ci',
    indexes: [
      {
        fields: ['syncId'],
        unique: true,
      },
    ],
    classMethods: {
      associate: function (models) {
        // associations can be defined here
      }
    }
  });
  FileInfo.sync();
  return FileInfo;
};