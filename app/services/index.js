import * as dcmParse from './dcmParse';
import * as dcmUpload from './dcmUpload';
import * as dcmDiff from './dcmDiff';
import * as serverApi from './serverApi';
import * as dcmAutoPush from './dcmAutoPush';
import co from 'co';
import * as Config from '../modules/config'

dcmUpload.setInternal(false);
serverApi.setBaseUrl('http://localhost:3000');

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
};


export { dcmParse, dcmUpload, serverApi, dcmDiff, dcmAutoPush, uploadSetting }