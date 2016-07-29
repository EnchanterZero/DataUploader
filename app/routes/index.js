var express = require('express');
import * as dcmapi from '../services/dcmapi';
import * as Oss from '../modules/oss';
import * as DcmInfo from '../modules/dcminfo';
import { parseDicom, uploadDioms } from '../services';
var api = express.Router();
var config = require('../../config');
var co = require('co');
var _ = require('lodash');
import authapi from './auth';
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
// function getAuthPage(req, res, next) {
//   res.render('auth', { title: 'Uploader' });
// }
// function getMainPage(req, res, next) {
//   res.render('templates/upload', { title: 'Uploader', menu: 'Upload' });
// }
// function getSettingPage(req, res, next) {
//   res.render('templates/setting', { title: 'Uploader', menu: 'Setting' });
// }
// function getAutoScanPage(req, res, next) {
//   res.render('templates/autoScan', { title: 'Uploader', menu: 'AutoScan' });
// }
//
// function readDcm(req, res, next) {
//   let data = req.body;
//   console.log(data.dir);
//   co(function*() {
//     var dcmInfos = yield parseDicom(UPLOAD_DIR);
//     var studies = dcmInfos.map((item) => {
//       return {
//         PatientName: item.PatientName,
//         PatientID: item.PatientID,
//         StudyInstanceUID: item.StudyInstanceUID,
//       }
//     });
//     studies = _.uniqBy(studies,'StudyInstanceUID');
//     res.json({
//       code: 200,
//       data: {
//         studies: studies,
//         dcmInfos: dcmInfos,
//       }
//     });
//   }).catch((err) => {
//     logger.error(err);
//   });
// }
//
// function startUpload(req, res, next) {
//   let data = req.body;
//   let dcmInfos = data.dcmInfos;
//   co(function*() {
//     yield uploadDioms(dcmInfos);
//     var result = {};
//     res.json({
//       code: 200,
//       data: result
//     });
//   }).catch((err) => {
//     logger.error(err);
//   });
// }
//
// function startAutoScan(req, res, next) {
//   var transportId = new Date().getTime();
//   if (!autoScan) {
//     autoScan = dcmapi.startAutoScan(AUTOSCAN_DIR, transportId.toString());
//   }
//   res.json({
//     code: 200,
//     data: {}
//   });
// }
//
// function endAutoScan(req, res, next) {
//   var transportId = new Date().getTime();
//   if (autoScan) {
//     dcmapi.stopAutoScan(autoScan);
//   }
//   res.json({
//     code: 200,
//     data: {}
//   });
// }
//
// router.get('/', getAuthPage);
// router.post('/auth', authenticate);
//
// router.get('/upload', getMainPage);
// router.post('/upload/read', readDcm);
// router.post('/upload/start', startUpload);
//
// router.get('/autoScan', getAutoScanPage);
// router.post('/autoScan/start', startAutoScan);
// router.post('/autoScan/end', endAutoScan);
//
// router.get('/setting', getSettingPage);
api.use('/auth',authapi);
export default api;
