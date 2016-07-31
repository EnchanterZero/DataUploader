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
var AUTOSCAN_DIR = '/Users/intern07/Desktop/dcms/autoscan';

/**
 * chilld process to process autoscan
 */
var autoScan;
/* GET home page. */
// function getAuthPage(req, res, next) {
//   res.render('auth', { title: 'Uploader' });
// }



//

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
