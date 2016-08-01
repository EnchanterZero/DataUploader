import { Router } from 'express';
import { util } from '../util';
import co from 'co';
import { dcmParse,dcmUpload,serverApi } from '../services'
const manualUploadApi = Router();

var UPLOAD_DIR = '/Users/intern07/Desktop/dcms/test';

function getUploadPage(req, res, next) {
  res.render('templates/manualUpload', { title: 'Uploader', menu: 'Upload' });
}

function readDcm(req, res, next) {
  let data = req.body;
  console.log(data.dir);
  co(function*() {
    var dcmInfos = yield dcmParse.parseDicom(UPLOAD_DIR);
    var studies = dcmInfos.map((item) => {
      return {
        PatientName: item.PatientName,
        PatientID: item.PatientID,
        StudyInstanceUID: item.StudyInstanceUID,
      }
    });
    studies = util._.uniqBy(studies,'StudyInstanceUID');
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
  co(function*() {
    yield dcmUpload.uploadDicoms(dcmInfos);
    var result = {};
    res.json({
      code: 200,
      data: result
    });
  }).catch((err) => {
    logger.error(err);
  });
}
manualUploadApi.get('/',getUploadPage);
manualUploadApi.post('/read',readDcm);
manualUploadApi.post('/start',startUpload);

export default manualUploadApi;