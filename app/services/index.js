import * as fileUpload from './fileUpload';
import * as serverApi from './serverApi';
import * as uploadRecovery from './uploadRecovery'
import co from 'co';
import * as FileInfo from  '../modules/fileinfo';
import * as Config from '../modules/config';

/**
 * initializing of service
 */
co(function*() {
  yield FileInfo.checkAndRepair();
})
//const apiServerUrl = 'https://api-staging01.curacloudplatform.com:3001';
//const serverUrl = 'https://api-geno-s01.curacloudplatform.com:443';
//serverApi.setServerUrl(serverUrl);

var $settings = null;
function loadConfig() {
  return co(function*() {
    console.log('load Upload Configs from database...');
    $settings = yield Config.getConfig();
    serverApi.setServerUrl($settings[Config.CONFIG_FIELD.GenoServerUrl]);
    return $settings;
  })
}
function getConfig() {
  return co(function*() {
    if (!$settings) {
      yield loadConfig();
    }
    return $settings;
  })
}
function setConfig(settings) {
  console.log('set Upload Configs from database...');
  Object.assign($settings, settings);
  return co(function* () {
    yield Config.setConfig($settings);
    serverApi.setServerUrl($settings[Config.CONFIG_FIELD.GenoServerUrl]);
    return $settings;
  })
}
var uploadSetting = {
  loadConfig: loadConfig,
  getConfig: getConfig,
  setConfig: setConfig,
  CONFIG_FIELD: Config.CONFIG_FIELD,
};
export { serverApi, uploadSetting, fileUpload, uploadRecovery }