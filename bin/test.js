var q = require('q');
var co = require('co');
var config = require('../config');
var dcmService = require('../service/dcmService');
var sychronizeService = require('../service/synchronizeService');
var mongoDBService = require('../service/mongoDBService');
var _ = require('lodash');

var logger = config.logger;
var filePath = config.dcmTempDir;
var pullDcmsTopullStudyThreshold = config.pullDcmsTopullStudyThreshold;
var rePushTroubleCountThreshold = config.rePushTroubleCountThreshold;
var rePushTroubleWait = config.rePushTroubleWait;

/*var buffer = fs.readFileSync('/Users/intern07/Desktop/000000.dcm');
console.log(buffer instanceof Buffer);
console.log(buffer);
var i = buffer.indexOf('\u0008 \u0018');
console.log(i);*/


co(function* () {
    var result = yield dcmService.pushDcmsAndRecordOneByOne(1,1,'/Users/intern07/Desktop/dicom2');
    console.log(result.length);
}).catch(function (err) {
    console.log(err+' : ' + err.stack);
});
