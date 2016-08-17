import { Router } from 'express';
import { util } from '../util';
import { uploadRecovery } from '../services';
const logger = util.logger.getLogger('uploadStatusApi');
import co from 'co';
import * as FileInfo from '../modules/fileinfo';
import * as Status from '../modules/status';
const uploadStatusApi = Router();

function getUploadStatus(req, res, next) {
  const syncId = req.params.syncId;
  co(function*() {

    let r = yield FileInfo.getFileInfoBySyncId(syncId);
    // let success = result.success.count;
    // let total = result.success.count + result.failed.count;
    res.json({
      code: 200,
      data: {
        success: r.progress,
        total: 1,
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
    let r = yield FileInfo.listUploadingFiles()
    res.json({
      code: 200,
      data: {
        uploadingFiles:r,
      },
    });
    uploadRecovery.recover(r);
  }).catch(err=> {
    logger.error(err);
  });
}


uploadStatusApi.get('/', getAllUploadStatus);
uploadStatusApi.get('/all', getAllUploadStatus);
uploadStatusApi.get('/one/:syncId', getUploadStatus);
uploadStatusApi.get('/check', checkStatus);

export default uploadStatusApi;