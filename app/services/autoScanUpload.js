import co from 'co';
import * as cp from 'child_process';
import fs from 'fs';
import Promise from 'bluebird';
import path from 'path';
import { dcmDiff,dcmParse,dcmUpload }  from '../services';
import { util } from '../util';
var logger = util.logger.getLogger('cp_autoScan');

console.log(process.argv);
var AUTOSCAN_DIR = process.argv[2];
var syncId = process.argv[3];
var DELAY_TIME = process.argv[4];
var FLAG = true;

co(function*() {
  /**
   * main loop
   */
  while (FLAG) {
    //get diff
    var result = yield dcmDiff.getDiff(AUTOSCAN_DIR,syncId);
    var newDcmPaths = result.newDcmPaths;
    var newDcmInfos = result.newDcmInfos;
    //upload
    dcmUpload.uploadDioms(newDcmInfos);
    //delay
    yield Promise.delay(DELAY_TIME);
  }
}).catch((err)=>{
  console.log(err);
});

process.on('message', function (m) {
  console.log('got message!!!!');
  if (m == 'stop') {
    console.log('Auto Scan stop!!!!');
    FLAG = false;
  }
});


function start(UPLOAD_DIR, transportId) {
  var autoScan = cp.fork('app/services/autoScan.js', [UPLOAD_DIR, transportId, 5000]);
  return autoScan;
}
function stop(autoScan) {
  co(function*() {
    autoScan.send('stop')
    autoScan = null;
  });
}
export { start , stop }