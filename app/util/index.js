/**
 * Created by intern07 on 16/7/27.
 */
import { logger } from './logger'
import fs from 'fs';
import Promise from 'bluebird';
import q from 'q';
import _ from 'lodash';
import string from './string'
/**
 * 递归处理文件,文件夹
 * @param path 路径
 * @param floor 层数
 * @param handleFile 文件,文件夹处理函数
 */
function walk(path, floor, handleFile) {
  handleFile(path, floor);
  floor++;
  var files = fs.readdirSync(path);
  files.forEach(function (item) {
    var tmpPath = path + '/' + item;
    var stats = fs.statSync(tmpPath)
    if (stats.isDirectory()) {
      walk(tmpPath, floor, handleFile);
    } else {
      handleFile(tmpPath, floor);
    }
  });
}
function walkDir(DirPath) {
  var filePaths = [];
  var handleFile = function (path, floor) {
    var stats = fs.statSync(path)
    if (stats.isDirectory()) {
      process.stdout.write('*');
    } else {
      process.stdout.write('.');
      filePaths.push(path);
    }
  }
  walk(DirPath, 0, handleFile);
  process.stdout.write('\n');
  return filePaths;
}
function size(filepath) {
  return Promise.promisify(fs.stat, fs)(filepath)
  .then((stat) => stat.size);
}

function remove(filepath) {
  return Promise.promisify(fs.unlink, fs)(filepath)
  .then((err) => {
    console.log(err);
  });
}

function parallelReduce(items, parallel, handler) {
  return Promise.all(
    _.map(
      _.chunk(items, Math.ceil(items.length / parallel)),
      (worklist) =>
        _.reduce(
          worklist,
          (promise, item) => promise.then(() => handler(item)),
          Promise.resolve()
        )
    )
  );
}

function wait(millscends) {
  //logger.info('** run command: **\n'+cmd);
  var defer = q.defer();
  _.delay(function (millscends) {
    console.log('waited for ' + millscends + 'ms');
    defer.resolve();
  }, millscends, millscends);

  return defer.promise;
}
var util = {
  string,
  _,
  logger,
  wait,
  parallelReduce,
  remove,
  size,
  walkDir,
};
export { util };