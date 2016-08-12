import { dcmUpload, dcmAutoPush, dcmAutoScan, uploadSetting, dcmDiff } from '../services';
import { projectConfig } from '../config';
import path from 'path';
import * as Status from '../modules/status';
import { util } from '../util';
import co from 'co';
const logger = util.logger.getLogger('uploadRecovery');
export function recover(status) {
  // { ManualUpload: '1234567890',
  //   AutoScanUpload: '',
  //   AutoPushUpload: '' }
  if (status.ManualUpload) {
    recoverManualUpload(status.ManualUpload);
  }
  if (status.AutoScanUpload) {
    recoverAutoScanUpload(status.AutoScanUpload);
  }
  if (status.AutoPushUpload) {
    recoverAutoPushUpload(status.AutoPushUpload);
  }
}

function recoverManualUpload(syncId) {
  logger.debug('Recovering: ManualUpload... ');
  co(function*() {
    let settings = uploadSetting.getConfig();
    let r = yield dcmDiff.getDiff(settings.UploadDir, syncId);
    let unfinishedDcms = r.newDcmInfos;
    if (unfinishedDcms.length > 0) {
      yield dcmUpload.uploadDicoms(unfinishedDcms, syncId, { afterDelete: false });
      let result = util._.countBy(unfinishedDcms, 'isSynchronized');
      if (!result['false']) {
        yield Status.updateStatus(Status.UPLOAD_TYPE.ManualUpload, '');
      }
    } else {
      logger.debug(`records not match: syncId[${syncId}] have no unfinished dicoms`);
      yield Status.updateStatus(Status.UPLOAD_TYPE.ManualUpload, '');
    }
  }).catch(err=> {
    logger.error(err);
  })
}
function recoverAutoScanUpload(syncId) {
  logger.debug('Recovering: AutoScanUpload... ');
  co(function*() {
    /**
     * upload unfinished parts if left
     */
    let settings = uploadSetting.getConfig();
    let r = yield dcmDiff.getDiff(settings.ScanDir, syncId);
    let unfinishedDcms = r.newDcmInfos;
    if (unfinishedDcms.length > 0) {
      yield dcmUpload.uploadDicoms(unfinishedDcms, syncId, { afterDelete: false });
      let result = util._.countBy(unfinishedDcms, 'isSynchronized');
      if (result['false']) {
        logger.debug(`recover AutoScan Upload: did not upload all left dcms`);
      }
    }
    dcmAutoScan.startScan(settings.ScanDir, syncId);
  }).catch(err=> {
    logger.error(err);
  })
}
function recoverAutoPushUpload(syncId) {
  logger.debug('Recovering: AutoPushUpload... ');
  co(function*() {
    /**
     * upload unfinished parts if left
     */
    const DEFAULT_TEMP_PATH = path.join(path.dirname(projectConfig.projectRoot), '/dcmTempDir');
    let settings = uploadSetting.getConfig();
    let r = yield dcmDiff.getDiff(DEFAULT_TEMP_PATH, syncId);
    let unfinishedDcms = r.newDcmInfos;
    if (unfinishedDcms.length > 0) {
      yield dcmUpload.uploadDicoms(unfinishedDcms, syncId, { afterDelete: true });
      let result = util._.countBy(unfinishedDcms, 'isSynchronized');
      if (result['false']) {
        logger.debug(`recover AutoPush Upload: did not upload all left dcms`);
      }
    }
    dcmAutoPush.openPort('DCMUPLOADER', settings.PACSServerIP, settings.PACSServerPort, 3000, syncId);
  }).catch(err=> {
    logger.error(err);
  })
}