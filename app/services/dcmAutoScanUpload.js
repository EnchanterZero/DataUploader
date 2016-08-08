import co from 'co';
import { dcmDiff, dcmUpload,serverApi }  from '../services';
import Promise from 'bluebird';
import { util } from '../util';
var logger = util.logger.getLogger('cp_autoScan');

/**
 * parse args
 * example : node dcmAutoScanUpload dir=PATH syncId=XXX delayTime=NUMBER afterDelete=BOOLEAN token=8WSA76D987G452F3B
 */

//params
let _dir = '';
let _syncId = '';
let _delayTime = 5000;
let _afterDelete = false;
let _token = '';
let _uploadType = '';

//loop controller
var FLAG = true;

let args = util._.cloneDeep(process.argv);
args.shift();
args.shift();
console.log(args);
args.map(arg => {
  if (arg) {
    let s = arg.split("=");
    if (s[0] == 'dir') {
      _dir = s[1];
    }
    if (s[0] == 'syncId') {
      _syncId = s[1];
    }
    if (s[0] == 'delayTime') {
      _delayTime = Number(s[1]);
    }
    if (s[0] == 'afterDelete') {
      if (s[1] === 'true')
        _afterDelete = true;
    }
    if (s[0] == 'token') {
      _token = s[1];
    }
    if (s[0] == 'uploadType') {
      _uploadType = s[1];
    }
  }
});

if (!_dir || !_syncId || !_token) {
  process.send('autoUpload error');
  process.send('autoUpload stopped');
  process.exit();
}


co(function*() {
  /**
   * main loop
   */
  serverApi.setAuthToken(_token);
  while (FLAG) {
    logger.debug('[cp_autoScan]--------new round of auto scan');
    //get diff
    var result = yield dcmDiff.getDiff(_dir, _syncId);
    var newDcmPaths = result.newDcmPaths;
    var newDcmInfos = result.newDcmInfos;
    logger.debug('[cp_autoScan]--------find new dicom file: ' + newDcmPaths.length, newDcmPaths);
    //upload
    dcmUpload.uploadDicoms(newDcmInfos, _syncId, { afterDelete: _afterDelete,uploadType:_uploadType });
    //delay
     logger.debug('[cp_autoScan]--------sleep for ' + _delayTime + 'ms\n');
     yield Promise.delay(_delayTime);
  }
  process.send('autoUpload stopped');
  process.exit();
}).catch((err)=> {
  console.log(err, err.stack);
});

process.on('message', function (m) {
  console.log('got message!!!!');
  if (m == 'stop') {
    console.log('Auto Scan stop!!!!');
    FLAG = false;
  }
});
