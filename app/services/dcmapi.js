/**
 * Created by intern07 on 16/7/26.
 */
import q from 'q';
import co from 'co';
import _ from 'lodash';
import Promise from 'bluebird';
import * as cp from 'child_process';
var config = require('../../config');
var dcmService = require('../../service/dcmService');
var dcmMongoService = require('../../service/dcmMongoService');


var logger = config.logger;
var localTempfilePath = config.dcmTempDir;
var pullDcmsTopullStudyThreshold = config.pullDcmsTopullStudyThreshold;
var rePushTroubleCountThreshold = config.rePushTroubleCountThreshold;
var rePushTroubleWait = config.rePushTroubleWait;

var autoScan = null;

export function* readDcm(Path, transportId) {
  var dcmMetas = yield dcmService.readDcmRecursion(Path);
  dcmMetas.map((item)=> {
    item.syncId = transportId;
  });
  console.log(dcmMetas);
  var studies = dcmMetas.map((item) => {
    return item.StudyInstanceUID
  });
  studies = _.uniq(studies);
  return { studies: studies, dcmMetas: dcmMetas };
}
export function* saveDcmMetas(dcmMetas) {
  var duplicatedDcmPaths = yield dcmMongoService.setDcmsPath(dcmMetas);
}

export function* getDiff(UPLOAD_DIR, transportId) {
  [studies, dcmMetas] = yield readDcm(UPLOAD_DIR, transportId);
  var DcmsMetaRecords = yield dcmMongoService.findAllDcmBysyncId(transportId);
  var UIDRecords = DcmsMetaRecords.map((item) => {
    return item.dcmPath;
  });
  var UIDLocal = dcmMetas.map((item) => {
    return item.dcmPath;
  });
  var newFilepaths = _.difference(UIDRecords, UIDLocal);
  return newFilepaths;
}
export function startAutoScan(UPLOAD_DIR, transportId) {
  console.log('46546546546545465465');
  var autoScan = cp.fork('app/services/autoScan.js', [UPLOAD_DIR, transportId]);
  return autoScan;
}
export function stopAutoScan() {
  co(function*() {
    autoScan.send('stop')
    autoScan = null;
  });
}