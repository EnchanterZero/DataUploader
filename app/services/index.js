import * as fileUpload from './fileUpload';
import * as serverApi from './serverApi';
import * as uploadRecovery from './uploadRecovery'
import co from 'co';
import * as FileInfo from  '../modules/fileinfo';
import * as Config from '../modules/config';

/**
 * initializing of service
 */
co(function* () {
  yield FileInfo.checkAndRepair();
})
//const apiServerUrl = 'https://api-staging01.curacloudplatform.com:3001';
const serverUrl = 'https://api-geno-s02.curacloudplatform.com:443';
serverApi.setServerUrl(serverUrl);

var $settings = null;
function loadConfig() {
  return co(function*() {
    console.log('load Upload Configs from database...');
    $settings = yield Config.getConfig();
    return $settings;
  })
}
function getConfig() {
  return $settings;
}
function setConfig(settings) {
  console.log('set Upload Configs from database...');
  $settings = settings;
}
var uploadSetting = {
  loadConfig: loadConfig,
  getConfig: getConfig,
  setConfig: setConfig,
  CONFIG_FIELD:Config.CONFIG_FIELD,
};
export { serverApi, uploadSetting, fileUpload, uploadRecovery }