import { util } from '../util';
import * as path from 'path';
import fs from 'fs';
const logger = util.logger.getLogger('upload');
import { serverApi, dcmDiff, } from '../services';
import { ossConfig } from '../config';
import * as FileInfo from '../modules/fileinfo'
import * as OSS from '../modules/oss';
import Promise from 'bluebird';
import co from 'co';

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
    syncId: fileInfo.syncId,
  };
  return co(function*() {
    //create file and ask for token if it it a new upload
    if (!fileInfo.fileId) {
      let fileObj = yield serverApi.createFile(fileInfo.projectId, data);
      fileInfo.fileId = fileObj.id;
    }
    let { credential:ossCredential,file:file} = yield serverApi.getOSSToken(fileInfo.projectId, fileInfo.fileId);
    if(fileInfo.ossPath && fileInfo.ossPath!= file.objectKey){
      logger.error('ossPath has changed!!')
    }
    fileInfo.ossPath = file.objectKey;
    // record into sqlite
    let [fileDataValue,created] = yield FileInfo.createFileInfo(fileInfo);
    FileInfo.addToUnfinishedFileList(fileDataValue);
    logger.debug('start upload!!!!!!!!!');
    //upload
    yield OSS.putOSSFile(ossCredential, false, fileInfo, options);

    //check if finished
    if (fileInfo.progress == 1) {
      yield serverApi.updateUploadPercentage(fileInfo.projectId, fileInfo.fileId, { percentage: 1 })
    }
  })
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
    let currentUser = serverApi.getBaseUser();
    if (!currentUser) {
      throw new Error('no currentUser');
    }
    var syncId = sId ? sId*1 : new Date().getTime();
    //set upload record base data
    var count = 0;
    var fileInfos = filePaths.map(item=> {
      let stat = fs.statSync(item.filePath);
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
        syncId: (syncId+count++),
        userId: currentUser.id,
        uploadType: 'test',
      }
    });
    return co(function*() {
      for (let i in fileInfos) {
        logger.debug('start upload---------->' + fileInfos[i].filePath);
        uploadOneFile(fileInfos[i], options ? options : {});
        yield Promise.delay(100);
      }
      return {
        filePaths: filePaths,
        syncId: syncId,
        fileCount:filePaths.length,
      };
    }).catch(err => {
      logger.error(err.message, err.stack);
    });
  }
  //filePaths.length == 0 means this upload is a resume upload
  else {
    if (!sId) {
      throw new Error('no syncId when upload starting')
    }
    return co(function*() {
      let f = yield FileInfo.getFileInfoBySyncId(sId);
      if (!f) {
        throw new Error('can not get FileInfo By SyncId when upload resuming')
      }
      f.status = FileInfo.FileInfoStatuses.uploading;
      if (FileInfo.addToUnfinishedFileList(f)) {
        logger.debug('resume upload---------->' + f.filePath);
        yield FileInfo.updateFileInfo(f, { status: FileInfo.FileInfoStatuses.uploading });
        yield uploadOneFile(f, options ? options : {});
        return {
          filePaths: [f.filePath],
          syncId: syncId,
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
  return Promise.resolve();
  /*return co(function*() {
   yield FileInfo.setFileInfoPausing(syncId);
   })
   .catch(err=>logger.log(err))*/
}

function stopAllUploading() {
  FileInfo.unfinishedFileList.map(item => {
    if(item.status!=FileInfo.FileInfoStatuses.paused && item.status!=FileInfo.FileInfoStatuses.failed && item.status !=FileInfo.FileInfoStatuses.finished) {
      FileInfo.setStatusToUnfinishedFileList(item.syncId, FileInfo.FileInfoStatuses.suspending);
    }
  });
  logger.debug('ready to pause');
  return co(function* () {
    while(FileInfo.unfinishedFileList.length > 0){
      logger.debug("-----------*-*-*--*-*---*-*-*-*-*-*ready to log off");
      yield Promise.delay(100);
    }
    return {};
  })
}

function abortUploadFiles(syncId) {
  FileInfo.setStatusToUnfinishedFileList(syncId, FileInfo.FileInfoStatuses.aborting);
  logger.debug('ready to abort');
  return co(function*() {
    //let result = yield FileInfo.setFileInfoAborted(syncId);
    //if (result) {
    logger.debug('abort upload---------->' + syncId);
    var fileInfo = yield FileInfo.getFileInfoBySyncId(syncId);
    let { credential:ossCredential,file:file} = yield serverApi.getOSSToken(fileInfo.projectId, fileInfo.fileId);
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
      return co(function*() {
        var fileInfo = yield FileInfo.getFileInfoBySyncId(item.syncId);
        let { credential:ossCredential,file:file} = yield serverApi.getOSSToken(fileInfo,projectId,fileInfo.fileId);
        yield OSS.abortMitiUpload(ossCredential, false, fileInfo);
      })
    })
  });
  return Promise.all(stoppings).catch(err => {
    logger.error(err, err.stack);
  });
}




export {
  setInternal,
  uploadFiles,
  stopUploadFiles,
  abortUploadFiles,
  stopAllUploading,
}