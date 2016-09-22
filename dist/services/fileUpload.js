'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stopAllUploading = exports.abortUploadFiles = exports.stopUploadFiles = exports.uploadFiles = exports.setInternal = undefined;

var _util = require('../util');

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _services = require('../services');

var _config = require('../config');

var _fileinfo = require('../modules/fileinfo');

var FileInfo = _interopRequireWildcard(_fileinfo);

var _oss = require('../modules/oss');

var OSS = _interopRequireWildcard(_oss);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _co = require('co');

var _co2 = _interopRequireDefault(_co);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

const logger = _util.util.logger.getLogger('upload');


let internal;
function setInternal(val) {
  logger.debug('setInternal', val);
  internal = val;
}

function uploadOneFile(fileInfo, options) {

  //logger.debug(dcmInfos);
  let data = {
    size: fileInfo.size,
    name: fileInfo.name,
    syncId: fileInfo.syncId
  };
  return (0, _co2.default)(function* () {
    //create file and ask for token if it it a new upload
    if (!fileInfo.fileId) {
      let fileObj = yield _services.serverApi.createFile(fileInfo.projectId, data);
      fileInfo.fileId = fileObj.id;
    }

    var _ref = yield _services.serverApi.getOSSToken(fileInfo.projectId, fileInfo.fileId);

    let ossCredential = _ref.credential;
    let file = _ref.file;

    if (fileInfo.ossPath && fileInfo.ossPath != file.objectKey) {
      logger.error('ossPath has changed!!');
    }
    fileInfo.ossPath = file.objectKey;
    // record into sqlite
    yield FileInfo.createFileInfo(fileInfo);
    FileInfo.addToUnfinishedFileList(fileInfo);
    logger.debug('start upload!!!!!!!!!');
    //upload
    yield OSS.putOSSFile(ossCredential, false, fileInfo, options);

    //check if finished
    if (fileInfo.progress == 1) {
      yield _services.serverApi.updateUploadPercentage(fileInfo.projectId, fileInfo.fileId, { percentage: 1 });
    }
  });
  /*.catch(err => {
    logger.debug(err.message, err.stack, err);
  })*/
}

/**
 * @param project {Array}
 * @param filePaths {Array}
 * @param sId
 * @param options
 * @returns {*|Promise.<T>}
 */
function uploadFiles(project, filePaths, sId, options) {
  //filePaths.length > 0 means this upload is a new upload
  if (filePaths.length > 0) {
    let currentUser = _services.serverApi.getBaseUser();
    if (!currentUser) {
      throw new Error('no currentUser');
    }
    var syncId = sId ? sId * 1 : new Date().getTime();
    //set upload record base data
    var count = 0;
    var fileInfos = filePaths.map(item => {
      let stat = _fs2.default.statSync(item.filePath);
      return {
        name: path.basename(item.filePath),
        filePath: item.filePath,
        projectName: project.name,
        projectId: project.id,
        size: stat.size,
        progress: '0',
        checkPointTime: '0',
        speed: '0',
        checkPoint: '',
        status: FileInfo.FileInfoStatuses.uploading,
        fileId: '',
        ossPath: '',
        syncId: syncId + count++,
        userId: currentUser.id,
        uploadType: 'test'
      };
    });
    return (0, _co2.default)(function* () {
      for (let i in fileInfos) {
        logger.debug('start upload---------->' + fileInfos[i].filePath);
        uploadOneFile(fileInfos[i], options ? options : {});
        yield _bluebird2.default.delay(100);
      }
      return {
        filePaths: filePaths,
        syncId: syncId,
        fileCount: filePaths.length
      };
    }).catch(err => {
      logger.error(err.message, err.stack);
    });
  }
  //filePaths.length == 0 means this upload is a resume upload
  else {
      if (!sId) {
        throw new Error('no syncId when upload starting');
      }
      return (0, _co2.default)(function* () {
        let f = yield FileInfo.getFileInfoBySyncId(sId);
        if (!f) {
          throw new Error('can not get FileInfo By SyncId when upload resuming');
        }
        f.status = FileInfo.FileInfoStatuses.uploading;
        if (FileInfo.addToUnfinishedFileList(f)) {
          logger.debug('resume upload---------->' + f.filePath);
          yield FileInfo.updateFileInfo(f, { status: FileInfo.FileInfoStatuses.uploading });
          yield uploadOneFile(f, options ? options : {});
          return {
            filePaths: [f.filePath],
            syncId: syncId
          };
        }
      }).catch(err => {
        logger.error(err, err.stack);
        throw err;
      });
    }
}

function stopUploadFiles(syncId) {
  FileInfo.setStatusToUnfinishedFileList(syncId, FileInfo.FileInfoStatuses.pausing);
  logger.debug('ready to pause');
  return _bluebird2.default.resolve();
  /*return co(function*() {
   yield FileInfo.setFileInfoPausing(syncId);
   })
   .catch(err=>logger.log(err))*/
}

function stopAllUploading() {
  FileInfo.unfinishedFileList.map(item => {
    if (item.status != 'paused' && item.status != 'aborted') {
      FileInfo.setStatusToUnfinishedFileList(item.syncId, 'suspending');
    }
  });
  logger.debug('ready to pause');
  return _bluebird2.default.resolve();
}

function abortUploadFiles(syncId) {
  FileInfo.setStatusToUnfinishedFileList(syncId, FileInfo.FileInfoStatuses.aborting);
  logger.debug('ready to abort');
  return (0, _co2.default)(function* () {
    //let result = yield FileInfo.setFileInfoAborted(syncId);
    //if (result) {
    logger.debug('abort upload---------->' + syncId);
    var fileInfo = yield FileInfo.getFileInfoBySyncId(syncId);

    var _ref2 = yield _services.serverApi.getOSSToken(fileInfo.projectId, fileInfo.fileId);

    let ossCredential = _ref2.credential;
    let file = _ref2.file;
    //abort the upload

    let result = yield OSS.abortMitiUpload(ossCredential, false, fileInfo);
    return result;
  }).catch(err => {
    logger.error(err, err.stack);
  });
}

function abortAllUploading() {
  var stoppings = [];
  FileInfo.unfinishedFileList.map(item => {
    stoppings.push(function () {
      return (0, _co2.default)(function* () {
        var fileInfo = yield FileInfo.getFileInfoBySyncId(item.syncId);

        var _ref3 = yield _services.serverApi.getOSSToken(fileInfo, projectId, fileInfo.fileId);

        let ossCredential = _ref3.credential;
        let file = _ref3.file;

        yield OSS.abortMitiUpload(ossCredential, false, fileInfo);
      });
    });
  });
  return _bluebird2.default.all(stoppings).catch(err => {
    logger.error(err, err.stack);
  });
}

exports.setInternal = setInternal;
exports.uploadFiles = uploadFiles;
exports.stopUploadFiles = stopUploadFiles;
exports.abortUploadFiles = abortUploadFiles;
exports.stopAllUploading = stopAllUploading;