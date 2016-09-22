'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Config = exports.FileInfo = undefined;

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _sequelize3 = require('../sequelize');

var _sequelize4 = _interopRequireDefault(_sequelize3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const FileInfo = exports.FileInfo = require('./fileinfo').create(_sequelize4.default, _sequelize2.default);
const Config = exports.Config = require('./config').create(_sequelize4.default, _sequelize2.default);

const models = _sequelize4.default.models;

FileInfo.associate(models);
Config.associate(models);

exports.default = models;