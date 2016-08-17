import { Router } from 'express';
import { util } from '../util';
const logger = util.logger.getLogger('manualUploadApi');
import co from 'co';
import fs from 'fs';
import { dcmParse, dcmUpload, serverApi, fileUpload } from '../services';
import * as FileInfo from '../modules/fileinfo';
const manualUploadApi = Router();

var UPLOAD_DIR = '/Users/intern07/Desktop/dcms/test';

var dcmInfos = null;

function startUpload(req, res, next) {
  let data = req.body;
  let filePath = data.dir;
  var syncId = new Date().getTime().toString();
  res.json({
    code: 200,
    data: { syncId: syncId }
  });
  co(function*() {
    let r = yield fileUpload.uploadFiles([filePath], syncId, { afterDelete: false });
  }).catch((err) => {
    logger.error(err, err.stack);
  });
}
function listFiles(req, res, next) {
  co(function*() {
    let r = yield FileInfo.listFiles();
    res.json({
      code: 200,
      data: { fileInfoList: r }
    });
  })
  .catch((err) => {
    logger.error(err, err.stack);
  });
}
function resumeUpload(req, res, next) {
  const syncId = req.params.syncId;
  co(function*() {
    let r = yield fileUpload.uploadFiles([], syncId, { afterDelete: false });
  })
  .catch((err) => {
    logger.error(err, err.stack);
  });
}

function stopUpload(req, res, next) {
  const syncId = req.params.syncId;
  fileUpload.stopUploadFiles(syncId)
  .then((r)=> {
    res.json({
      code: 200,
      data: { result: r }
    });
  });
}

manualUploadApi.post('/start', startUpload);
manualUploadApi.get('/list', listFiles);
manualUploadApi.post('/resume/:syncId', resumeUpload);
manualUploadApi.post('/stop/:syncId', stopUpload);

export default manualUploadApi;