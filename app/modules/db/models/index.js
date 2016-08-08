import Sequelize from 'sequelize';
import sequelize from '../sequelize';

export const Dcminfo = require('./dcminfo').create(sequelize, Sequelize);
export const Config = require('./config').create(sequelize, Sequelize);

const models = sequelize.models;

Dcminfo.associate(models);
Config.associate(models);

export default models;