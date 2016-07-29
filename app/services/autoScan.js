import co from 'co';
import OSS from 'ali-oss';
import fs from 'fs';
import Promise from 'bluebird';
import path from 'path';

var config = require('../../config');
import * as dcmapi from './dcmapi';
import * as ossapi from './ossapi';
import { util } from '../util'
var logger = util.logger.getLogger('autoScan');
var localTempfilePath = config.dcmTempDir;

console.log(process.argv);
var AUTOSCAN_DIR = process.argv[2];
var syncId = process.argv[3];
var DELAY_TIME = process.argv[4];
var FLAG = true;
co(function*() {
  while (FLAG) {
    var result = yield dcmapi.getDiff(AUTOSCAN_DIR,syncId);
    var newDcmPaths = result.newDcmPaths;
    var newDcmMetas = result.newDcmMetas
    yield dcmapi.saveDcmMetas(newDcmMetas,syncId);
    

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
})