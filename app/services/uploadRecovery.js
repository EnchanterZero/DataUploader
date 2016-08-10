import { dcmUpload, dcmAutoPush } from '../services';
import * as DcmInfo from '../modules/dcminfo';
import * as Status from '../modules/status';
import { util } from '../util';
import co from 'co';
const logger = util.logger.getLogger('uploadRecovery');
export function recover(status) {
  // { ManualUpload: '1234567890',
  //   AutoScanUpload: '',
  //   AutoPushUpload: '' }
  if(status.ManualUpload){
    recoverManualUpload(status.ManualUpload);
  }
  if(status.AutoScanUpload){
    recoverAutoScanUpload(status.AutoScanUpload);
  }
  if(status.AutoPushUpload){
    recoverAutoPushUpload(status.AutoPushUpload);
  }
}

function recoverManualUpload(syncId) {
  logger.debug('Recovering: ManualUpload... ');
  co(function* () {
    let unfinishedDcms = yield DcmInfo.getDcmInfoBySyncId(syncId,{isSynchronized:false});
    if(unfinishedDcms.length > 0){
      yield dcmUpload.uploadDicoms(unfinishedDcms, syncId,{afterDelete:false});
      Status.updateStatus(Status.UPLOAD_TYPE.ManualUpload,'');
    }else{
      
    }
  }).catch(err=>{
    logger.error(err);
  })
}
function recoverAutoScanUpload(syncId) {
  logger.debug('Recovering: AutoScanUpload... ');
  co(function* () {
    dcmUpload
  }).catch(err=>{
    logger.error(err);
  })
}
function recoverAutoPushUpload(syncId) {
  logger.debug('Recovering: AutoPushUpload... ');
  co(function* () {
    let unfinishedDcms = yield DcmInfo.getDcmInfoBySyncId(syncId,{isSynchronized:false});
    if(unfinishedDcms.length > 0){
      yield dcmUpload.uploadDicoms(unfinishedDcms, syncId,{afterDelete:false});
    }else{

    }
  }).catch(err=>{
    logger.error(err);
  })
}