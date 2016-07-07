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
    var arr = ['1.2.840.88888888.3.20150912121121.7436369','1.2.840.88888888.3.20150825145012.7421970','1.2.410.200010.86.101.5201411140048'];
    var index = arr.indexOf();

}).catch(function (err) {
    console.log(err+' : ' + err.stack);
});
