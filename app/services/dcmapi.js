/**
 * Created by intern07 on 16/7/26.
 */
var q = require('q');
var co = require('co');
var config = require('../../config');
var dcmService = require('../../service/dcmService');
var mongoDBService = require('../../service/dcmMongoService');
var _ = require('lodash');

var logger = config.logger;
var localTempfilePath = config.dcmTempDir;
var pullDcmsTopullStudyThreshold = config.pullDcmsTopullStudyThreshold;
var rePushTroubleCountThreshold = config.rePushTroubleCountThreshold;
var rePushTroubleWait = config.rePushTroubleWait;

exports.readDcm = function*(Path) {
  // co(function*() {
  var transportId = new Date().getTime();
  var dest = localTempfilePath + '/' + transportId;
  yield dcmService.cpStudyDir(Path, dest);
  var dcmMetas = yield dcmService.readDcmRecursion(dest);
  dcmMetas.map((item)=> {
    item.syncId = transportId.toString();
  });
  console.log(dcmMetas);
  var duplicatedDcmPaths = yield mongoDBService.setDcmsPath(dcmMetas);
  var studies = dcmMetas.map((item) => {
    return item.StudyInstanceUID
  });
  studies = _.uniq(studies);
  return { studies: studies, dcmCount: dcmMetas.length, syncId: transportId.toString() };
  // }).catch(function (err, msg) {
  //   logger.error(err, msg)
  // })
}