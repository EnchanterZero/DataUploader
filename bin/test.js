var q = require('q');
var co = require('co');
var config = require('../config');
var dcmService = require('../service/dcmService');
var sychronizeService = require('../service/synchronizeService');
var mongoDBService = require('../service/mongoDBService');
var dcmMongoService = require('../service/dcmMongoService');
var _ = require('lodash');

var logger = config.logger;
var filePath = config.dcmTempDir;
var pullDcmsTopullStudyThreshold = config.pullDcmsTopullStudyThreshold;
var rePushTroubleCountThreshold = config.rePushTroubleCountThreshold;
var rePushTroubleWait = config.rePushTroubleWait;

var logger = config.logger;
var dcmTempDir = config.dcmTempDir;
var dcm4cheBinPath = config.dcm4cheBinPath;
var pullingEnd = config.pullingSCP_Host + ':' + config.pullingSCP_Port;
var pushingEnd = config.pushingSCP_Host + ':' + config.pushingSCP_Port;
var pullingSCP_AET = config.pullingSCP_AET;
var pushingSCP_AET = config.pushingSCP_AET;

/*var buffer = fs.readFileSync('/Users/intern07/Desktop/000000.dcm');
console.log(buffer instanceof Buffer);
console.log(buffer);
var i = buffer.indexOf('\u0008 \u0018');
console.log(i);*/
/*
var pushDcmsAndRecordOneByOne = function (synchronizeID, stepcount, path) {
    //logger.info('pushing all dcms:');
    var defer = q.defer();
    var count = 0;
    var AffectedSOPClassUIDs = [];
    var command = dcm4cheBinPath + '/storescu';
    var args = ['-c', pushingSCP_AET + '@' + pushingEnd, path];

    var storescu = require('child_process').spawn(command, args);

    storescu.stdout.on('data', (data) => {
        console.log('//////////');
        console.log(data.toString());
        console.log('//////////');

        var pushedStudyIDs = dcmService.parseStoreSCUStdout(data.toString());
        if (pushedStudyIDs.length > 0) {
            AffectedSOPClassUIDs = AffectedSOPClassUIDs.concat(pushedStudyIDs);
            co(function*() {
                yield mongoDBService.setDcmSynchronized(pushedStudyIDs);
            }).catch(function (err) {
                console.log(err+' : ' + err.stack);
            });
            for (var i in pushedStudyIDs) {
                count++;
                logger.info('[synchronize ' + synchronizeID + '][step ' + (stepcount) + ' push] pushed Dcm :(' + (count) + ')[' + pushedStudyIDs[i] + ']');

            }
        }
    });
    storescu.stderr.on('err', (data) => {
        logger.error('stderr:' + data);
    });
    storescu.on('exit', () => {
        //console.log('-----------------------------[On exit]');
        defer.resolve(AffectedSOPClassUIDs);
    });
    return defer.promise;
}*/

co(function* () {
    //var dcmMetas = yield dcmService.readDcm('/Users/intern07/Desktop/dicom3');
    //var duplicatedDcmPaths = yield mongoDBService.setDcmsPath(dcmMetas);
    //var result = yield pushDcmsAndRecordOneByOne(1,1,'/Users/intern07/Desktop/dicom3');
    //console.log(result.length);

    yield dcmMongoService.addSynchronizingStudy({
        "_id" : "1",
        "StudyInstanceUID" : "1"
    });
    var result = yield dcmMongoService.findSynchronizingStudy('1');
    console.log(result);

    var result = yield dcmMongoService.removeSynchronizingStudy('1');
    console.log(result);
}).catch(function (err) {
    console.log(err+' : ' + err.stack);
});
