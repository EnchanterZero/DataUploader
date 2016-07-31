import q from 'q';
import co from 'co';
import _ from 'lodash';
import Promise from 'bluebird';
import * as util from '../../util/index'
var config = require('../../config');
var dcmService = require('../../service/dcmService');
var dcmMongoService = require('../../service/dcmMongoService');


var logger = config.logger;
var localTempfilePath = config.dcmTempDir;
var pullDcmsTopullStudyThreshold = config.pullDcmsTopullStudyThreshold;
var rePushTroubleCountThreshold = config.rePushTroubleCountThreshold;
var rePushTroubleWait = config.rePushTroubleWait;





