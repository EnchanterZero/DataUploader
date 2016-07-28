import Sequelize from 'sequelize';
import sequelize from '../sequelize';

export const Dcminfo = require('./dcminfo').create(sequelize, Sequelize);

const models = sequelize.models;

Dcminfo.associate(models);

export default models;