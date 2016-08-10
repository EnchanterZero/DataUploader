import { Router } from 'express';
import { util } from '../util';
const logger = util.logger.getLogger('manualUploadApi');
import co from 'co';
import * as Status from '../modules/status'
import { dcmParse, dcmUpload, serverApi } from '../services'
const manualUploadApi = Router();

var UPLOAD_DIR = '/Users/intern07/Desktop/dcms/test';



function readDcm(req, res, next) {
  let data = req.body;
  const readDir = data.dir;
  console.log('readDcm:' +  readDir);
  co(function*() {
    var dcmInfos = yield dcmParse.parseDicom(readDir);
    var studies = dcmInfos.map((item) => {
      return {
        PatientName: item.PatientName,
        PatientID: item.PatientID,
        StudyInstanceUID: item.StudyInstanceUID,
      }
    });
    studies = util._.uniqBy(studies, 'StudyInstanceUID');
    console.log(studies);
    res.json({
      code: 200,
      data: {
        studies: studies,
        dcmInfos: dcmInfos,
      }
    });
  }).catch((err) => {
    logger.error(err);
  });
}

function startUpload(req, res, next) {
  let data = req.body;
  let dcmInfos = data.dcmInfos;
  var syncId = new Date().getTime().toString();
  res.json({
    code: 200,
    data: { syncId: syncId }
  });
  co(function*() {
    Status.updateStatus(Status.UPLOAD_TYPE.ManualUpload,syncId);
    let r = yield dcmUpload.uploadDicoms(dcmInfos, syncId,{afterDelete:false});
    Status.updateStatus(Status.UPLOAD_TYPE.ManualUpload,'');
    //console.log('upload result: ',r);
    //var uploadResult = yield DcmInfo.countDcmInfoBySyncId(r.syncId);
  }).catch((err) => {
    logger.error(err,err.stack);
  });
}

manualUploadApi.post('/read', readDcm);
manualUploadApi.post('/start', startUpload);

export default manualUploadApi;