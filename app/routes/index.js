var express = require('express');
var dcmapi = require('../services/dcmapi');
var router = express.Router();
var config = require('../../config');
var co = require('co');
var _ = require('lodash');

var logger = config.logger;
var localTempfilePath = config.dcmTempDir;
var pullDcmsTopullStudyThreshold = config.pullDcmsTopullStudyThreshold;
var rePushTroubleCountThreshold = config.rePushTroubleCountThreshold;
var rePushTroubleWait = config.rePushTroubleWait;

/* GET home page. */
function getAuthPage(req, res, next) {
  res.render('auth', { title: 'Uploader' });
}
function getMainPage(req, res, next) {
  res.render('templates/upload', { title: 'Uploader' , menu:'Upload'});
}
function getSettingPage(req, res, next) {
  res.render('templates/setting', { title: 'Uploader',menu:'Setting' });
}

function readDcm(req, res, next) {
  let data = req.body;
  console.log(data.dir);
  co(function* () {
    var result = yield dcmapi.readDcm('/Users/intern07/Desktop/dcms/test');
    res.json({
      code: 200,
      data: result
    });
  }).catch((err) =>{
    logger.error(err);
  });
}

function startUpload(req, res, next) {
  let data = req.body;
  console.log(data.file);
  console.log(data.ossCredential);
  console.log(data.syncId);
  co(function* () {
    var result = {};
    res.json({
      code: 200,
      data: result
    });
  }).catch((err) =>{
    logger.error(err);
  });
}


router.get('/', getAuthPage);
router.get('/index', getMainPage);
router.get('/upload', getMainPage);
router.get('/setting', getSettingPage);

router.post('/upload/read', readDcm);
router.post('/upload/start', startUpload);

module.exports = router;
