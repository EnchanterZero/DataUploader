var express = require('express');
import * as dcmapi from '../services/dcmapi';
import * as ossapi from '../services/ossapi';
import * as DcmInfo from '../modules/dcminfo'
var router = express.Router();
var config = require('../../config');
var co = require('co');
var _ = require('lodash');

var logger = config.logger;
var localTempfilePath = config.dcmTempDir;
var pullDcmsTopullStudyThreshold = config.pullDcmsTopullStudyThreshold;
var rePushTroubleCountThreshold = config.rePushTroubleCountThreshold;
var rePushTroubleWait = config.rePushTroubleWait;
var UPLOAD_DIR = '/Users/intern07/Desktop/dcms/test';
var AUTOSCAN_DIR = '/Users/intern07/Desktop/dcms/autoscan';

/**
 * chilld process to process autoscan
 */
var autoScan;
/* GET home page. */
function getAuthPage(req, res, next) {
  DcmInfo.createDcmInfo(
    {
      "StudyInstanceUID" : "1.2.840.88888888.3.20150825145012.7421970",
      "SeriesInstanceUID" : "1.3.12.2.1107.5.1.4.74080.30000015082400402627500031888",
      "SOPInstanceUID" : "1.3.12.2.1107.5.1.4.74080.30000015082400402627500032022",
      "dcmPath" : "65446556564564885465468894",
      "isSynchronized" : true,
      "syncId": '1469518737161'
    });
  res.render('auth', { title: 'Uploader' });
}
function getMainPage(req, res, next) {
  res.render('templates/upload', { title: 'Uploader', menu: 'Upload' });
}
function getSettingPage(req, res, next) {
  res.render('templates/setting', { title: 'Uploader', menu: 'Setting' });
}
function getAutoScanPage(req, res, next) {
  res.render('templates/autoScan', { title: 'Uploader', menu: 'AutoScan' });
}

function readDcm(req, res, next) {
  let data = req.body;
  console.log(data.dir);
  var transportId = new Date().getTime();
  co(function*() {
    var result = yield dcmapi.readDcm(UPLOAD_DIR, transportId.toString());
    yield dcmapi.saveDcmMetas(result.dcmMetas);
    res.json({
      code: 200,
      data: {
        studies: result.studies,
        dcmCount: result.dcmMetas.length,
        syncId: transportId
      }
    });
  }).catch((err) => {
    logger.error(err);
  });
}

function startUpload(req, res, next) {
  let data = req.body;
  let credential = data.ossCredential;
  let syncId = data.syncId;
  let file = data.file;
  // console.log(file);
  console.log(credential);
  // console.log(syncId);
  //credential.AccessKeyId = 'RiJBujTkdDUiFzus';
  //credential.AccessKeySecret = '3BN8bGcuS4rXat9wTVLCWFsM3EAbbK';
  co(function*() {
    ossapi.putOSSObject(credential, false, file.id, syncId);
    var result = {};
    res.json({
      code: 200,
      data: result
    });
  }).catch((err) => {
    logger.error(err);
  });
}

function startAutoScan(req, res, next) {
  var transportId = new Date().getTime();
  if (!autoScan) {
    autoScan = dcmapi.startAutoScan(AUTOSCAN_DIR, transportId.toString());
  }
  res.json({
    code: 200,
    data: {}
  });
}

function endAutoScan(req, res, next) {
  var transportId = new Date().getTime();
  if (autoScan) {
    dcmapi.stopAutoScan(autoScan);
  }
  res.json({
    code: 200,
    data: {}
  });
}

router.get('/', getAuthPage);
router.get('/index', getMainPage);

router.get('/upload', getMainPage);
router.post('/upload/read', readDcm);
router.post('/upload/start', startUpload);

router.get('/autoScan', getAutoScanPage);
router.post('/autoScan/start', startAutoScan);
router.post('/autoScan/end', endAutoScan);

router.get('/setting', getSettingPage);

module.exports = router;
