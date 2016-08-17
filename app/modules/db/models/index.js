import Sequelize from 'sequelize';
import sequelize from '../sequelize';

export const FileInfo = require('./fileinfo').create(sequelize, Sequelize);
export const Config = require('./config').create(sequelize, Sequelize);
export const Status = require('./status').create(sequelize, Sequelize);

const models = sequelize.models;

FileInfo.associate(models);
Config.associate(models);
Status.associate(models);

export default models;