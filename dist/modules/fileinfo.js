'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unfinishedFileList = exports.FileInfoStatuses = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.addToUnfinishedFileList = addToUnfinishedFileList;
exports.getActiveUnfinishedFileList = getActiveUnfinishedFileList;
exports.getOneFromUnfinishedFileList = getOneFromUnfinishedFileList;
exports.setStatusToUnfinishedFileList = setStatusToUnfinishedFileList;
exports.setAttributesToUnfinishedFileList = setAttributesToUnfinishedFileList;
exports.removeFromUnfinishedFileList = removeFromUnfinishedFileList;
exports.resetUnfinishedFileList = resetUnfinishedFileList;
exports.getUnfinishedFileList = getUnfinishedFileList;
exports.createFileInfo = createFileInfo;
exports.deleteAllFileInfos = deleteAllFileInfos;
exports.updateFileInfo = updateFileInfo;
exports.setFileInfoPausing = setFileInfoPausing;
exports.setFileInfoAborted = setFileInfoAborted;
exports.getFileInfoBySyncId = getFileInfoBySyncId;
exports.listFiles = listFiles;
exports.listUploadingFiles = listUploadingFiles;
exports.checkAndRepair = checkAndRepair;

var _models = require('./db/models');

var _models2 = _interopRequireDefault(_models);

var _db = require('../modules/db');

var _util = require('../util');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const logger = _util.util.logger.getLogger('fileinfo');


/**
 * All columns fields of FileInfo
 *
 * name
 * filePath
 * progress
 * checkPointTime
 * speed
 * checkPoint
 * status   finished | uploading | paused | pausing
 * fileId
 * ossPath
 * syncId
 * userId
 * uploadType
 */

const FileInfoStatuses = exports.FileInfoStatuses = {
  finished: 'finished',
  uploading: 'uploading',
  paused: 'paused',
  pausing: 'pausing',
  waiting: 'waiting',
  suspending: 'suspending',
  failed: 'failed',
  aborting: 'aborting',
  aborted: 'aborted'
};

const unfinishedFileList = exports.unfinishedFileList = [];
const MAX_UPLOADING_COUNT = 5;

// export function checkUploadingCount() {
//   var count = 0;
//   unfinishedFileList.map(item =>{
//     switch(item.status){
//       case 'paused':
//         break;
//       case 'aborted':
//         break;
//       case 'failed':
//         break;
//       default:
//     }
//   });
// }
function addToUnfinishedFileList(fileInfo) {
  logger.debug('add To UnfinishedFileList', unfinishedFileList, fileInfo);
  for (var i in unfinishedFileList) {
    if (unfinishedFileList[i].syncId == fileInfo.syncId) {
      if (unfinishedFileList[i].status != FileInfoStatuses.paused || unfinishedFileList[i].status != FileInfoStatuses.aborted) {
        unfinishedFileList[i].status = FileInfoStatuses.uploading;
        return true;
      }
      logger.debug('duplicate to add to UnfinishedFileList', fileInfo);
      return false;
    }
  }
  var o = _util.util._.cloneDeep(fileInfo);
  //o.opreation = "";
  unfinishedFileList.push(o);
  return true;
}
function getActiveUnfinishedFileList() {
  logger.debug('get Active UnfinishedFileList', unfinishedFileList);
  var list = [];
  for (var i in unfinishedFileList) {
    if (unfinishedFileList[i].status != FileInfoStatuses.paused && unfinishedFileList[i].status != FileInfoStatuses.failed && unfinishedFileList[i].status != FileInfoStatuses.finished) {
      (function (i) {
        list.push(_util.util._.cloneDeep(unfinishedFileList[i]));
      })(i);
    }
  }
  return list;
}
function getOneFromUnfinishedFileList(syncId) {
  logger.debug('get One From UnfinishedFileList', unfinishedFileList, syncId);
  for (var i in unfinishedFileList) {
    if (unfinishedFileList[i].syncId == syncId) {
      return unfinishedFileList[i];
    }
  }
}
function setStatusToUnfinishedFileList(syncId, status) {
  logger.debug('set Status To UnfinishedFileList', unfinishedFileList, syncId);
  for (var i in unfinishedFileList) {
    if (unfinishedFileList[i].syncId == syncId) {
      unfinishedFileList[i].status = status;
      if (status == FileInfoStatuses.aborted) {
        removeFromUnfinishedFileList(syncId);
      }
      return;
    }
  }
}
function setAttributesToUnfinishedFileList(syncId, setField) {
  logger.debug('set progress To UnfinishedFileList', unfinishedFileList, syncId);
  for (var i in unfinishedFileList) {
    if (unfinishedFileList[i].syncId == syncId) {
      Object.assign(unfinishedFileList[i], setField);
      return;
    }
  }
}

function removeFromUnfinishedFileList(syncId) {
  logger.debug('remove From UnfinishedFileList', unfinishedFileList, syncId);
  for (var i in unfinishedFileList) {
    if (unfinishedFileList[i].syncId == syncId) {
      unfinishedFileList.splice(i, 1);
      return;
    }
  }
}
function resetUnfinishedFileList() {
  logger.debug('reset UnfinishedFileList', unfinishedFileList);
  while (unfinishedFileList.length > 0) {
    unfinishedFileList.pop();
  }
}
function getUnfinishedFileList(userId) {
  var list = [];
  unfinishedFileList.map(item => {
    if (item.userId == userId) {
      list.push(_util.util._.cloneDeep(item));
    }
  });
  return list;
};

/**
 * mem cache operation
 */

/**
 * Database operation
 */
function createFileInfo(fileInfo) {
  return _models2.default.FileInfo.findOrCreate({
    where: {
      filePath: fileInfo.filePath,
      syncId: fileInfo.syncId,
      userId: fileInfo.userId
    },
    defaults: fileInfo
  }).then(result => {
    logger.debug(result);

    var _result = _slicedToArray(result, 2);

    let instance = _result[0];
    let created = _result[1];

    return [instance.dataValues, created];
  }).catch(err => {
    logger.error(err, err.stack);
  });
}

function deleteAllFileInfos() {
  return _models2.default.FileInfo.destroy().then(result => {}).catch(err => {
    logger.error(err, err.stack);
  });
}

// export function updateFileInfo(fileInfo, options) {
//   let setField = {};
//   if (options && options.progress) {
//     setField.progress = options.progress;
//   }
//   if (options && options.status) {
//     setField.status = options.status;
//   }
//   if (options && options.checkPoint) {
//     setField.checkPoint = options.checkPoint;
//   }
//   return models.FileInfo.update(setField, {
//     where: {
//       filePath: fileInfo.filePath,
//       syncId: fileInfo.syncId,
//       userId: fileInfo.userId,
//     }
//   })
//   .then(result => {
//     if (!result[0]) {
//       logger.debug('err: ' + 'update failed', fileInfo)
//     }
//   })
//   .catch((err) => {
//     logger.error(err, err.stack)
//   });
// }

function updateFileInfo(fileInfo, options) {
  let setField = options;
  return _models2.default.FileInfo.update(setField, {
    where: {
      filePath: fileInfo.filePath,
      syncId: fileInfo.syncId,
      userId: fileInfo.userId
    }
  }).then(result => {
    if (!result[0]) {
      logger.debug('err: ' + 'update failed', fileInfo);
    }
    return !!result[0];
  }).catch(err => {
    logger.error(err, err.stack);
  });
}

function setFileInfoPausing(syncId) {
  return _models2.default.FileInfo.update({
    status: FileInfoStatuses.pausing
  }, {
    where: {
      syncId: syncId,
      status: FileInfoStatuses.uploading
    }
  }).then(result => {
    if (!result[0]) {
      logger.debug('err: ' + 'update failed', result);
    }
    return !!result[0];
  }).catch(err => {
    logger.error(err, err.stack);
  });
}

function setFileInfoAborted(syncId) {
  return _models2.default.FileInfo.update({
    status: FileInfoStatuses.aborted
  }, {
    where: {
      syncId: syncId,
      status: { $notIn: [FileInfoStatuses.finished] },
      progress: { $notIn: ['1'] }
    }
  }).then(result => {
    if (!result[0]) {
      logger.debug('err: ' + 'update failed', result);
    }
    return !!result[0];
  }).catch(err => {
    logger.error('err:', err);
  });
}

function getFileInfoBySyncId(SyncId) {
  let where = { SyncId: SyncId };
  return _models2.default.FileInfo.findOne({
    where: where
  }).then(results => {
    return results.dataValues;
  }).catch(err => {
    logger.error('err:', err);
  });
}

function listFiles(userId) {
  let where = { status: { $notIn: [FileInfoStatuses.aborted, FileInfoStatuses.finished] } };
  if (userId) where.userId = userId;
  return _models2.default.FileInfo.findAll({
    where: where,
    order: [['createdAt', 'DESC']]
  }).then(instanceArr => {
    var fileInfoArr = instanceArr.map(item => {
      return item.get({
        plain: true
      });
    });
    return fileInfoArr;
  }).catch(err => {
    logger.error('err:', err);
  });
}

function listUploadingFiles(userId) {
  let where = { status: [FileInfoStatuses.pausing, FileInfoStatuses.uploading] };
  if (userId) where.userId = userId;
  return _models2.default.FileInfo.findAll({
    where: where
  }).then(instanceArr => {
    var fileInfoArr = instanceArr.map(item => {
      return item.get({
        plain: true
      });
    });
    return fileInfoArr;
  }).catch(err => {
    logger.error('err:', err);
  });
}

function checkAndRepair() {
  return _models2.default.FileInfo.update({ status: FileInfoStatuses.paused }, {
    where: {
      progress: { $ne: 1 },
      status: FileInfoStatuses.finished
    }
  }).then(() => {
    return _models2.default.FileInfo.update({ status: FileInfoStatuses.finished }, {
      where: {
        progress: 1,
        status: { $notIn: [FileInfoStatuses.finished] }
      }
    });
  });
}