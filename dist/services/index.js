'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.appConfig = exports.uploadRecovery = exports.fileUpload = exports.uploadSetting = exports.serverApi = undefined;

var _fileUpload = require('./fileUpload');

var fileUpload = _interopRequireWildcard(_fileUpload);

var _serverApi = require('./serverApi');

var serverApi = _interopRequireWildcard(_serverApi);

var _uploadRecovery = require('./uploadRecovery');

var uploadRecovery = _interopRequireWildcard(_uploadRecovery);

var _co = require('co');

var _co2 = _interopRequireDefault(_co);

var _fileinfo = require('../modules/fileinfo');

var FileInfo = _interopRequireWildcard(_fileinfo);

var _config = require('../modules/config');

var Config = _interopRequireWildcard(_config);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _config2 = require('../config');

var appConfig = _interopRequireWildcard(_config2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * initializing of service
 */
(0, _co2.default)(function* () {
  yield FileInfo.checkAndRepair();
});
//const apiServerUrl = 'https://api-staging01.curacloudplatform.com:3001';
//const serverUrl = 'https://api-geno-s01.curacloudplatform.com:443';
//serverApi.setServerUrl(serverUrl);

var $settings = null;
function loadConfig() {
  return (0, _co2.default)(function* () {
    let retry = 5;
    do {
      console.log('try load Upload Configs from database...');
      try {
        $settings = yield Config.getConfig();
        //must get init value from db
        if ($settings.GenoServerUrl.length > 0) {
          console.log(`got GenoServerUrl--> ${ $settings.GenoServerUrl }`);
          break;
        }
      } catch (err) {
        console.log(err);
      }
      console.log('load Upload Configs failed, retry = ' + retry);
      yield _bluebird2.default.delay(100);
    } while (retry--);

    serverApi.setServerUrl($settings.GenoServerUrl);
    return $settings;
  });
}
function getConfig() {
  return (0, _co2.default)(function* () {
    if (!$settings) {
      yield loadConfig();
    }
    return $settings;
  });
}
function setConfig(settings) {
  console.log('set Upload Configs from database...');
  Object.assign($settings, settings);
  return (0, _co2.default)(function* () {
    yield Config.setConfig($settings);
    serverApi.setServerUrl($settings[Config.CONFIG_FIELD.GenoServerUrl]);
    return $settings;
  });
}
var uploadSetting = {
  loadConfig: loadConfig,
  getConfig: getConfig,
  setConfig: setConfig,
  CONFIG_FIELD: Config.CONFIG_FIELD
};
exports.serverApi = serverApi;
exports.uploadSetting = uploadSetting;
exports.fileUpload = fileUpload;
exports.uploadRecovery = uploadRecovery;
exports.appConfig = appConfig;