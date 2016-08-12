import { Router } from 'express';
import { util } from '../util';
import { uploadRecovery } from '../services';
const logger = util.logger.getLogger('uploadStatusApi');
import co from 'co';
import * as DcmInfo from '../modules/dcminfo';
import * as Status from '../modules/status';
const uploadStatusApi = Router();

function getUploadStatus(req, res, next) {
  const syncId = req.params.syncId;
  co(function*() {
    let result = yield DcmInfo.countDcmInfoBySyncId(syncId);
    let success = result.success.count;
    let total = result.success.count + result.failed.count;
    res.json({
      code: 200,
      data: {
        success: success,
        total: total,
      }
    });
  })
}

function getAllUploadStatus(req, res, next) {
  const syncId = req.params.syncId;
  co(function*() {
    let result = yield DcmInfo.listUploadingDcmInfo(syncId);
    res.json({
      code: 200,
      data: result
    });
  })
}

function checkStatus(req, res, next) {
  co(function*() {
    let result = yield Status.getStatus();
    res.json({
      code: 200,
      data: result,
    });
    uploadRecovery.recover(result);
  }).catch(err=> {
    logger.error(err);
  });
}


uploadStatusApi.get('/', getAllUploadStatus);
uploadStatusApi.get('/all', getAllUploadStatus);
uploadStatusApi.get('/one/:syncId', getUploadStatus);
uploadStatusApi.get('/check', checkStatus);

export default uploadStatusApi;