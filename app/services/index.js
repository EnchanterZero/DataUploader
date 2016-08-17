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
//serverApi.setBaseUrl('https://api-staging01.curacloudplatform.com:3001');
serverApi.setBaseUrl('http://127.0.0.1:3000/');

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