import { Router } from 'express';
import { util } from '../util';
const logger = util.logger.getLogger('uploadStatusApi');
import co from 'co';
import * as DcmInfo from '../modules/dcminfo'
const uploadStatusApi = Router();

function getUploadStatus(req, res, next) {
  const syncId = req.params.syncId;
  co(function* () {
    let result = yield DcmInfo.countDcmInfoBySyncId(syncId);
    let success = result.success.count
    let total = result.success.count + result.failed.count;
    logger.debug( '--------------------------------' + success + '/' + total );
    res.json({
      code:200,
      data:{
        success: success,
        total: total,
      }
    });
  })

}

uploadStatusApi.get('/:syncId',getUploadStatus);

export default uploadStatusApi;