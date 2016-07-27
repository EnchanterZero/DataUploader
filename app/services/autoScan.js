import co from 'co';
import OSS from 'ali-oss';
import _ from 'lodash';
import fs from 'fs';
import Promise from 'bluebird';
import path from 'path';
import * as util from '../../util/index';

var config = require('../../config');
var dcmapi = require('./dcmapi');
var ossapi = require('./ossapi');
var logger = config.logger;
var localTempfilePath = config.dcmTempDir;

console.log(process.argv);

var FLAG = true;
co(function*() {
  while (FLAG) {
    //yield dcmapi.getDiff();
    console.log('test!!!!!!!')
    yield Promise.delay(1000);
  }
});

process.on('message', function (m) {
  console.log('got message!!!!');
  if (m == 'stop') {
    console.log('Auto Scan stop!!!!');
    FLAG = false;
  }
})