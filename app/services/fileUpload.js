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

function createFile(filepath, name, type, meta) {
  console.log('createFile');
  console.log(JSON.stringify(meta))
}

function uploadOneFile(fileInfo, options) {

  //console.log(dcmInfos);
  let data = {
    size: fileInfo.size,
    fileName: fileInfo.name,
  };
  return co(function*() {
    //create file and ask for token if it it a new upload
    if (!fileInfo.fileId) {
      let file = yield serverApi.createFile(fileInfo.projectId, data);
      fileInfo.fileId = file.id;
    }
    let ossCredential = yield serverApi.getOSSToken(fileInfo.fileId);
    // record into sqlite
    yield FileInfo.createFileInfo(fileInfo);
    FileInfo.addToUnfinishedFileList(fileInfo);
    console.log('start upload!!!!!!!!!');
    //upload
    yield OSS.putOSSFile(ossCredential, false, fileInfo, options);

    //check if finished
    if (fileInfo.progress == 1) {
      yield serverApi.updateUploadPercentage(fileInfo.projectId, fileInfo.fileId, { percent: 1 })
    }
  }).catch(err => {
    logger.debug(err.message, err.stack);
  })
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
    var syncId = sId ? sId : new Date().getTime().toString();
    //set upload record base data
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
        syncId: syncId,
        userId: currentUser.id,
        uploadType: 'test',
      }
    });
    return co(function*() {
      for (let i in fileInfos) {
        logger.debug('start upload---------->' + fileInfos[i].filePath);
        yield uploadOneFile(fileInfos[i], options ? options : {});
      }
      return {
        filePaths: filePaths,
        syncId: syncId,
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
    });
  }
}

function stopUploadFiles(syncId) {
  FileInfo.setStatusToUnfinishedFileList(syncId, FileInfo.FileInfoStatuses.pausing);
  console.log('ready to pause');
  return Promise.resolve();
  /*return co(function*() {
   yield FileInfo.setFileInfoPausing(syncId);
   })
   .catch(err=>logger.log(err))*/
}

function abortUploadFiles(syncId) {
  FileInfo.setStatusToUnfinishedFileList(syncId, FileInfo.FileInfoStatuses.aborting);
  console.log('ready to abort');
  return co(function*() {
    //let result = yield FileInfo.setFileInfoAborted(syncId);
    //if (result) {
    logger.debug('abort upload---------->' + syncId);
    var fileInfo = yield FileInfo.getFileInfoBySyncId(syncId);
    let ossCredential = yield serverApi.getOSSToken(fileInfo.fileId);
    //abort the upload
    yield OSS.abortMitiUpload(ossCredential, false, fileInfo);
    //}


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
        let ossCredential = yield serverApi.getOSSToken(fileInfo.fileId);
        yield OSS.abortMitiUpload(ossCredential, false, fileInfo);
      })
    })
  });
  return Promise.all(stoppings).catch(err => {
    logger.error(err, err.stack);
  });
}

function stopAllUploading() {
  FileInfo.unfinishedFileList.map(item => {
    FileInfo.setStatusToUnfinishedFileList(item.syncId, 'suspending');
  });
  console.log('ready to pause');
  return Promise.resolve();
}


export {
  setInternal,
  uploadFiles,
  stopUploadFiles,
  abortUploadFiles,
  stopAllUploading,
}