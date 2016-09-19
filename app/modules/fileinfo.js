import models from './db/models';
import { sequelize } from '../modules/db';
import { util } from '../util';
const logger = util.logger.getLogger('fileinfo');
import Promise from  'bluebird';

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

export const FileInfoStatuses = {
  finished: 'finished',
  uploading: 'uploading',
  paused: 'paused',
  pausing: 'pausing',
  waiting: 'waiting',
  failed: 'failed',
  aborting:'aborting',
  aborted: 'aborted',
};

export const unfinishedFileList = [];
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
export function addToUnfinishedFileList(fileInfo) {
  logger.debug('add To UnfinishedFileList',unfinishedFileList,fileInfo);
  for(var i in unfinishedFileList){
    if(unfinishedFileList[i].syncId == fileInfo.syncId ){
      logger.debug('duplicate to add to UnfinishedFileList',fileInfo);
      return false;
    }
  }
  unfinishedFileList.push(util._.cloneDeep(fileInfo));
  return true;
}
export function getOneFromUnfinishedFileList(syncId) {
  logger.debug('get One From UnfinishedFileList',unfinishedFileList,syncId);
  for(var i in unfinishedFileList){
    if(unfinishedFileList[i].syncId == syncId ){
      return unfinishedFileList[i];
    }
  }
}
export function setStatusToUnfinishedFileList(syncId,status) {
  logger.debug('set Status To UnfinishedFileList',unfinishedFileList,syncId);
  for(var i in unfinishedFileList){
    if(unfinishedFileList[i].syncId == syncId ){
      unfinishedFileList[i].status = status;
      return;
    }
  }
}
export function removeFromUnfinishedFileList(syncId) {
  logger.debug('remove From UnfinishedFileList',unfinishedFileList,syncId);
  for(var i in unfinishedFileList){
    if(unfinishedFileList[i].syncId == syncId ){
      unfinishedFileList.splice(i,1);
      return;
    }
  }
}
export function resetUnfinishedFileList() {
  logger.debug('reset UnfinishedFileList',unfinishedFileList);
}

export function createFileInfo(fileInfo) {
  return models.FileInfo.findOrCreate({
    where: {
      filePath: fileInfo.filePath,
      syncId: fileInfo.syncId,
      userId: fileInfo.userId,
    },
    defaults: fileInfo
  }).then((result) => {
    let [rs,created] = result;
    return created;
  }).catch((err) => {
    logger.error(err, err.stack)
  });
}

export function deleteAllFileInfos() {
  return models.FileInfo.destroy()
  .then((result) => {
  }).catch((err) => {
    logger.error(err, err.stack)
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

export function updateFileInfo(fileInfo, options) {
  let setField = options;
  return models.FileInfo.update(setField, {
    where: {
      filePath: fileInfo.filePath,
      syncId: fileInfo.syncId,
      userId: fileInfo.userId,
    }
  })
  .then(result => {
    if (!result[0]) {
      logger.debug('err: ' + 'update failed', fileInfo)
    }
    return !!result[0];
  })
  .catch((err) => {
    logger.error(err, err.stack)
  });
}

export function setFileInfoPausing(syncId) {
  return models.FileInfo.update({
    status: FileInfoStatuses.pausing
  }, {
    where: {
      syncId: syncId,
      status: FileInfoStatuses.uploading,
    }
  })
  .then(result => {
    if (!result[0]) {
      logger.debug('err: ' + 'update failed', result)
    }
    return !!result[0];
  })
  .catch((err) => {
    logger.error(err, err.stack)
  });
}

export function setFileInfoAborted(syncId) {
  return models.FileInfo.update({
    status: FileInfoStatuses.aborted
  }, {
    where: {
      syncId: syncId,
      status: { $notIn: [FileInfoStatuses.finished,] },
      progress: { $notIn: [ '1'] },
    }
  })
  .then(result => {
    if (!result[0]) {
      logger.debug('err: ' + 'update failed', result)
    }
    return !!result[0];
  })
  .catch((err) => {
    logger.error('err:', err)
  });
}

export function getFileInfoBySyncId(SyncId) {
  let where = { SyncId: SyncId };
  return models.FileInfo.findOne({
    where: where
  })
  .then((results) => {
    return results.dataValues;
  })
  .catch((err) => {
    logger.error('err:', err)
  });
}

export function listFiles(userId) {
  let where = {status:{$ne:FileInfoStatuses.aborted}};
  if(userId) where.userId = userId;
  return models.FileInfo.findAll({
    where: where,
    order: [['createdAt', 'DESC']]
  })
  .then((instanceArr) => {
    var fileInfoArr = instanceArr.map(item=> {
      return item.get({
        plain: true
      })
    });
    return fileInfoArr;
  })
  .catch((err) => {
    logger.error('err:', err)
  });
}

export function listUploadingFiles(userId) {
  let where = { status: [FileInfoStatuses.pausing, FileInfoStatuses.uploading] };
  if(userId) where.userId = userId;
  return models.FileInfo.findAll({
    where: where,
  })
  .then((instanceArr) => {
    var fileInfoArr = instanceArr.map(item=> {
      return item.get({
        plain: true
      })
    });
    return fileInfoArr;
  })
  .catch((err) => {
    logger.error('err:', err)
  });
}

export function checkAndRepair() {
  return models.FileInfo.update({ status: FileInfoStatuses.paused }, {
    where: {
      progress: { $ne: 1 },
      status: FileInfoStatuses.finished
    },
  }).then(()=> {
    return models.FileInfo.update({ status: FileInfoStatuses.finished }, {
      where: {
        progress: 1,
        status: { $notIn: [FileInfoStatuses.finished] }
      },
    })
  })
}