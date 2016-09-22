'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.util = undefined;

var _logger = require('./logger');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _string = require('./string');

var _string2 = _interopRequireDefault(_string);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * 递归处理文件,文件夹
 * @param path 路径
 * @param floor 层数
 * @param handleFile 文件,文件夹处理函数
 */
function walk(path, floor, handleFile) {
  handleFile(path, floor);
  floor++;
  var files = _fs2.default.readdirSync(path);
  files.forEach(function (item) {
    var tmpPath = path + '/' + item;
    var stats = _fs2.default.statSync(tmpPath);
    if (stats.isDirectory()) {
      walk(tmpPath, floor, handleFile);
    } else {
      handleFile(tmpPath, floor);
    }
  });
} /**
   * Created by intern07 on 16/7/27.
   */

function walkDir(DirPath) {
  var filePaths = [];
  var handleFile = function handleFile(path, floor) {
    var stats = _fs2.default.statSync(path);
    if (stats.isDirectory()) {
      process.stdout.write('*');
    } else {
      process.stdout.write('.');
      filePaths.push(path);
    }
  };
  walk(DirPath, 0, handleFile);
  process.stdout.write('\n');
  return filePaths;
}
function ensureFolderExist(dir) {
  const parent = _path2.default.dirname(dir);
  if (!_fs2.default.existsSync(parent)) {
    ensureFolderExist(parent);
  }
  if (!_fs2.default.existsSync(dir)) {
    _fs2.default.mkdirSync(dir);
  }
}
function isDirectory(filepath) {
  return _bluebird2.default.promisify(_fs2.default.stat, _fs2.default)(filepath).then(stat => stat.isDirectory());
}
function size(filepath) {
  return _bluebird2.default.promisify(_fs2.default.stat, _fs2.default)(filepath).then(stat => stat.size);
}

function remove(filepath) {
  return _bluebird2.default.promisify(_fs2.default.unlink, _fs2.default)(filepath).then(err => {
    console.log(err);
  });
}

function parallelReduce(items, parallel, handler) {
  return _bluebird2.default.all(_lodash2.default.map(_lodash2.default.chunk(items, Math.ceil(items.length / parallel)), worklist => _lodash2.default.reduce(worklist, (promise, item) => promise.then(() => handler(item)), _bluebird2.default.resolve())));
}

function wait(millscends) {
  //logger.info('** run command: **\n'+cmd);
  var defer = _q2.default.defer();
  _lodash2.default.delay(function (millscends) {
    console.log('waited for ' + millscends + 'ms');
    defer.resolve();
  }, millscends, millscends);

  return defer.promise;
}
var util = {
  string: _string2.default,
  _: _lodash2.default,
  logger: _logger.logger,
  wait: wait,
  parallelReduce: parallelReduce,
  isDirectory: isDirectory,
  remove: remove,
  size: size,
  walkDir: walkDir,
  ensureFolderExist: ensureFolderExist
};
exports.util = util;