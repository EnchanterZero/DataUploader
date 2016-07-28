/**
 * Created by intern07 on 16/7/26.
 */
import q from 'q';
import co from 'co';
import _ from 'lodash';
import Promise from 'bluebird';
import * as cp from 'child_process';
import * as util from '../../util/index'
var config = require('../../config');
var dcmService = require('../../service/dcmService');
var dcmMongoService = require('../../service/dcmMongoService');


var logger = config.logger;
var localTempfilePath = config.dcmTempDir;
var pullDcmsTopullStudyThreshold = config.pullDcmsTopullStudyThreshold;
var rePushTroubleCountThreshold = config.rePushTroubleCountThreshold;
var rePushTroubleWait = config.rePushTroubleWait;




export function* readDcm(Path, transportId) {
  var filePaths = util.walkDir(Path);
  var dcmMetas = yield dcmService.readDcms(filePaths,transportId);
  dcmMetas.map((item)=> {
    item.syncId = transportId;
  });
  var studies = dcmMetas.map((item) => {
    return item.StudyInstanceUID
  });
  studies = _.uniq(studies);
  return { studies: studies, dcmMetas: dcmMetas };
}
export function* saveDcmMetas(dcmMetas) {
  var duplicatedDcmPaths = yield dcmMongoService.insert(dcmMetas);
}

export function* getDiff(UPLOAD_DIR, transportId) {
  var result = yield readDcm(UPLOAD_DIR, transportId);
  var dcmMetaLocals = result.dcmMetas;
  var dcmsMetaRecords = yield dcmMongoService.findAllDcmBysyncId(transportId);
  var newDcmMetas = _.differenceBy(dcmMetaLocals, dcmsMetaRecords,'dcmPath');
  console.log('dcmMetaLocals.length : ' + dcmMetaLocals.length);
  console.log('dcmsMetaRecords.length : ' + dcmsMetaRecords.length);
  console.log('newDcmMetas.length : ' + newDcmMetas.length);
  var newDcmPaths = newDcmMetas.map((item) => {
    return item.dcmPath;
  });
  console.log('newDcmPaths.length : ' + newDcmPaths.length);
  newDcmPaths = newDcmPaths?newDcmPaths:[];
  return {newDcmPaths:newDcmPaths, newDcmMetas:newDcmMetas};
}
export function startAutoScan(UPLOAD_DIR, transportId) {
  var autoScan = cp.fork('app/services/autoScan.js', [UPLOAD_DIR, transportId, 5000]);
  return autoScan;
}
export function stopAutoScan(autoScan) {
  co(function*() {
    autoScan.send('stop')
    autoScan = null;
  });
}