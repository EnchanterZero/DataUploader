import { dcmUpload, uploadSetting } from '../services';
import { util } from '../util';
const logger = util.logger.getLogger('dcmAutoScan');

let autoScan = null;
function startScan(scanDir, syncId) {
  if (!autoScan) {
    let setting = uploadSetting.getConfig();
    autoScan = dcmUpload.startAutoScanUpload(scanDir, syncId,
      {
        afterDelete: false,
        uploadType: 'AutoScanUpload',
        delayTime: setting.ScanInterval * 1000
      });
    }else{
    logger.debug('autoScan is already running!!!!')
  }
}

function stopScan(res) {
  if (autoScan) {
    dcmUpload.stopAutoScanUpload(autoScan,res);
  }else{
    logger.debug('autoScan was not running!!!!')
  }
}

export { startScan, stopScan }