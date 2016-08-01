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
import manualUploadApi from './manualUpload'

// var logger = config.logger;
// var localTempfilePath = config.dcmTempDir;
// var pullDcmsTopullStudyThreshold = config.pullDcmsTopullStudyThreshold;
// var rePushTroubleCountThreshold = config.rePushTroubleCountThreshold;
// var rePushTroubleWait = config.rePushTroubleWait;

/**
 * chilld process to process autoscan
 */


api.use('/',manualUploadApi);
api.use('/index',manualUploadApi);

api.use('/auth',authapi);
api.use('/manualUpload',manualUploadApi);

export default api;
