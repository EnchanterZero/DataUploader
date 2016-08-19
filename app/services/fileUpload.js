import { util } from '../util';
import * as path from 'path';
import fs from 'fs';
const logger = util.logger.getLogger('upload');
import { serverApi, dcmDiff, } from '../services';
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
    type: 'UploadFile',
    size: '0',
    hash: 'NONE',
    name: fileInfo.name,
    isZip: false
  };
  return co(function*() {
    //create file and ask for token if it it a new upload
    if (!fileInfo.fileId) {
      let createFileResult = yield serverApi.createFile(data);
      let file = createFileResult.data.file;
      fileInfo.fileId = file.id;
    }
    let getTokenResult = yield serverApi.getOSSToken(fileInfo.fileId);
    let ossCredential = getTokenResult.data.ossCredential;

    // record into sqlite
    yield FileInfo.createFileInfo(fileInfo);
    console.log('start upload!!!!!!!!!');
    //upload
    yield OSS.putOSSFile(ossCredential, false, fileInfo, options);
  });
}

/**
 * @param project {Array}
 * @param filePaths {Array}
 * @param sId
 * @param options
 * @returns {*|Promise.<T>}
 */
function uploadFiles(project,filePaths, sId, options) {
  //filePaths.length > 0 means this upload is a new upload
  if (filePaths.length > 0) {
    var syncId = sId ? sId : new Date().getTime().toString();
    var fileInfos = filePaths.map(item=> {
      let stat = fs.statSync(item.filePath);
      return {
        name: path.basename(item.filePath),
        filePath: item.filePath,
        project: project,
        size: stat.size,
        progress: '0',
        checkPointTime: '0',
        speed: '0',
        checkPoint: '',
        status: FileInfo.FileInfoStatuses.uploading,
        fileId: '',
        syncId: syncId,
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
      logger.error(err);
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
      logger.debug('resume upload---------->' + f.filePath);
      yield FileInfo.updateFileInfo(f, { status: FileInfo.FileInfoStatuses.uploading });
      yield uploadOneFile(f, options ? options : {});
      return {
        filePaths: [f.filePath],
        syncId: syncId,
      };
    }).catch(err => {
      logger.error(err, err.stack);
    });
  }
}

function stopUploadFiles(syncId) {
  return co(function*() {
    yield FileInfo.setFileInfoPausing(syncId);
  })
  .catch(err=>logger.log(err))
}

function abortUploadFiles(syncId) {
  return co(function*() {
    let result = yield FileInfo.setFileInfoAborted(syncId);
    if(result) {
      logger.debug('abort upload---------->' + syncId);
      var fileInfo = yield FileInfo.getFileInfoBySyncId(syncId);
      let getTokenResult = yield serverApi.getOSSToken(fileInfo.fileId);
      let ossCredential = getTokenResult.data.ossCredential;
      //abort the upload
      yield OSS.abortMitiUpload(ossCredential, false, fileInfo);
    }

    
    
    
  }).catch(err => {
    logger.error(err, err.stack);
  });
}


export {
  setInternal,
  uploadFiles,
  stopUploadFiles,
  abortUploadFiles,
}