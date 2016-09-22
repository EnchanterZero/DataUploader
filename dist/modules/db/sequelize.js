'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ensureDBConnection = exports.isStringField = exports.sequelize = undefined;

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _co = require('co');

var _co2 = _interopRequireDefault(_co);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _config = require('../../config');

var _util = require('../../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const logger = _util.util.logger.getLogger('db');

require('sqlite3');

var dbpath = _config.dbConfig.storage;
const sequelize = new _sequelize2.default(_config.dbConfig.database, _config.dbConfig.username, _config.dbConfig.password, {
  host: _config.dbConfig.host,
  dialect: _config.dbConfig.dialect,
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  storage: dbpath
});
sequelize.authenticate().then(function (err) {
  logger.debug(err);
  logger.debug('Connection has been established successfully.', dbpath);
}).catch(function (err) {
  logger.debug('Unable to connect to the database:', err);
});

function isStringField(fieldType) {
  return fieldType instanceof _sequelize2.default.TEXT || fieldType instanceof _sequelize2.default.STRING || fieldType instanceof _sequelize2.default.UUIDV1 || fieldType instanceof _sequelize2.default.UUIDV4;
}

function ensureDBConnection() {
  return (0, _co2.default)(function* () {
    while (true) {
      try {
        yield sequelize.authenticate();
        break;
      } catch (e) {
        if (e instanceof _sequelize2.default.ValidationError) {
          throw e;
        }
        logger.debug(`sequelize.authenticate failed: ${ e.message }`);
        yield _bluebird2.default.delay(1000);
      }
    }

    yield sequelize.sync({});
    return true;
  });
}

exports.default = sequelize;
exports.sequelize = sequelize;
exports.isStringField = isStringField;
exports.ensureDBConnection = ensureDBConnection;