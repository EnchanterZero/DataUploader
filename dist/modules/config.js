'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CONFIG_FIELD = undefined;
exports.getConfig = getConfig;
exports.setConfig = setConfig;

var _models = require('./db/models');

var _models2 = _interopRequireDefault(_models);

var _util = require('../util');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const logger = _util.util.logger.getLogger('dicominfo');
function getConfig() {
  return _models2.default.Config.findAll({}).then(result => {
    let r = {};
    result.map(item => {
      r[item.key] = item.value;
    });
    return r;
  }).catch(err => {
    logger.debug('err:' + err);
    throw err;
  });
}

function setConfig(settings) {
  let KVPairs = [];
  let successCount = 0;
  for (let key in settings) {
    KVPairs.push({
      key: key,
      value: settings[key]
    });
  }
  logger.debug(KVPairs);

  return _bluebird2.default.each(KVPairs, item => {
    return _models2.default.Config.update({ value: item.value }, {
      where: {
        key: item.key
      }
    }, 0).then(result => {
      successCount++;
      return result;
    }).catch(err => {
      logger.error(err, err.stack);
    });
  }).catch(err => {
    logger.debug(err, err.stack);
    throw err;
  });
}

const CONFIG_FIELD = exports.CONFIG_FIELD = {
  GenoServerUrl: 'GenoServerUrl'
};