import Sequelize from 'sequelize';
import sequelize from '../sequelize';

export const Dcminfo = require('./dcminfo').create(sequelize, Sequelize);
export const Config = require('./config').create(sequelize, Sequelize);
export const Status = require('./status').create(sequelize, Sequelize);

const models = sequelize.models;

Dcminfo.associate(models);
Config.associate(models);
Status.associate(models);

export default models;