import co from 'co';
import fs from 'fs';
import Promise from 'bluebird';
import path from 'path';
import { dcmDiff, dcmUpload }  from '../services';
import { util } from '../util';
var logger = util.logger.getLogger('cp_autoScan');

console.log(process.argv);
var AUTOSCAN_DIR = process.argv[2];
var syncId = process.argv[3];
var DELAY_TIME = process.argv[4];
var AFTER_DELETE = process.argv[5];
var FLAG = true;

co(function*() {
  /**
   * main loop
   */
  while (FLAG) {
    logger.debug('[cp_autoScan]--------new round of auto scan');
    //get diff
    var result = yield dcmDiff.getDiff(AUTOSCAN_DIR, syncId);
    var newDcmPaths = result.newDcmPaths;
    var newDcmInfos = result.newDcmInfos;
    logger.debug('[cp_autoScan]--------find new dicom file: ' + newDcmPaths.length, newDcmPaths);
    //upload
    let afterDelete = false;
    if (AFTER_DELETE) {
      if (AFTER_DELETE == 'afterDelete=true')
        afterDelete = true;
    }
    dcmUpload.uploadDicoms(newDcmInfos, syncId, { afterDelete: afterDelete });
    //delay
    logger.debug('[cp_autoScan]--------sleep for ' + DELAY_TIME + 'ms\n');
    yield Promise.delay(DELAY_TIME);
  }
}).catch((err)=> {
  console.log(err);
});

process.on('message', function (m) {
  console.log('got message!!!!');
  if (m == 'stop') {
    console.log('Auto Scan stop!!!!');
    FLAG = false;
  }
});
