import { dcmUpload, uploadSetting } from '../services';
import { util } from '../util';
import * as Status from '../modules/status';
import co from 'co';
const logger = util.logger.getLogger('dcmAutoScan');

let autoScan = null;
function startScan(scanDir, syncId) {
  if (!autoScan) {
    co(function* () {
      yield Status.updateStatus(Status.UPLOAD_TYPE.AutoScanUpload,syncId);
      let setting = uploadSetting.getConfig();
      autoScan = dcmUpload.startAutoScanUpload(scanDir, syncId,
        {
          afterDelete: false,
          uploadType: 'AutoScanUpload',
          delayTime: setting.ScanInterval * 1000
        });
    })
  }else{
    logger.debug('autoScan is already running!!!!')
  }
}

function stopScan(res) {
  if (autoScan) {
    co(function* () {
      dcmUpload.stopAutoScanUpload(autoScan,res);
      autoScan = null;
      yield Status.updateStatus(Status.UPLOAD_TYPE.AutoScanUpload,'');
    })
  }else{
    logger.debug('autoScan was not running!!!!')
  }
}

export { startScan, stopScan }