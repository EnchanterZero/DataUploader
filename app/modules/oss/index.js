/**
 * Created by intern07 on 16/7/28.
 */
import co from 'co';
import OSS from 'ali-oss';
import _ from 'lodash';
import fs from 'fs';
import Promise from 'bluebird';
import path from 'path';
import { util } from '../../util';
const logger = util.logger.getLogger('oss');
//import * as DcmInfo from '../dcminfo';
import * as FileInfo from '../fileinfo';

export function getOSSClient(credential, internal) {
  return new OSS({
    //secure: internal,
    region: credential.Region,
    accessKeyId: credential.AccessKeyId,
    accessKeySecret: credential.AccessKeySecret,
    //stsToken: credential.Security,
    bucket: credential.Bucket,
  });
}

/**
 * for (big) files
 */

/**
 *
 * @param credential {object} from API Server
 * @param internal {boolean}
 * @param dcmInfos {array} Array of DcmInfo
 * @param options {object} options.afterDelete: default false
 * @returns none
 */


export function putOSSFile(credential, internal, fileInfo, options) {
  logger.info('getOSSObject internal =', internal);
  const BLOCK_SIZE = 1024 * 1024;
  logger.info('getOSSObject blockSize =', BLOCK_SIZE);
  let afterDelete = false;
  if (options && options.afterDelete === true) {
    afterDelete = true;
  }
  logger.info('getOSSObject options.afterDelete =', afterDelete);
  const ossClient = getOSSClient(credential, internal);
  logger.info(`Start putOSSObject ${credential.Region} ${credential.Bucket} ${fileInfo.fileId} `);
  const filePath = fileInfo.filePath;
  const objectKey = fileInfo.ossPath;
  let retry = 2;
  // start upload
  return co(function *() {
      do {
        try {
          let fileSize;
          if (fileInfo.size)
            fileSize = fileInfo.size;
          else
            fileSize = yield util.size(filePath);
          logger.info('putting OSS File : ', objectKey, filePath, ' fileSize : ' + fileSize);
          if (fileSize > BLOCK_SIZE) {
            let progress = function*(p, cpt) {
              logger.debug(`uploading ${filePath} to ${objectKey}, progress: ${p}`);
              logger.debug(FileInfo.unfinishedFileList);
              const time = new Date().getTime();
              //let lastRecord = yield FileInfo.getFileInfoBySyncId(fileInfo.syncId);
              let lastStatus = FileInfo.getOneFromUnfinishedFileList(fileInfo.syncId).status;
              //store file upload info
              // cpt.doneParts = [];
              let setField = {};
              setField.progress = p;
              setField.checkPoint = JSON.stringify(cpt);
              setField.checkPointTime = time;

              //if upload finished, ignore pausing and continue
              if (p === 1) {
                setField.status = FileInfo.FileInfoStatuses.finished;
                let lastRecord = yield FileInfo.getFileInfoBySyncId(fileInfo.syncId);
                const start = new Date(Date.parse(lastRecord.createdAt)).getTime();
                setField.speed = fileSize / ((time - start) / 1000);
                logger.info('update FileInfo Finished : ', fileInfo.filePath, fileInfo.syncId);
                if (afterDelete) {
                  yield util.remove(fileInfo.filePath);
                  logger.info('remove temp DcmInfo : ', fileInfo.filePath, fileInfo.syncId);
                }
                //update
                Object.assign(fileInfo, setField);
                yield FileInfo.updateFileInfo(fileInfo, setField);
                //return true;
              }
              //if upload unfinished, status is not 'uploading' means upload need to stop
              else if (lastStatus != FileInfo.FileInfoStatuses.uploading) {
                logger.debug(`[${lastStatus}] uploading ${filePath} to ${objectKey}`);
                if (lastStatus == FileInfo.FileInfoStatuses.pausing)
                  setField.status = FileInfo.FileInfoStatuses.paused;
                Object.assign(fileInfo, setField);
                yield FileInfo.updateFileInfo(fileInfo, setField);
                FileInfo.removeFromUnfinishedFileList(fileInfo.syncId);
                //return false;
                throw new Error('upload stop');
              }
              //when upload unfinished and status is 'uploading', do nothing but update info continue
              else {
                Object.assign(fileInfo, setField);
                yield FileInfo.updateFileInfo(fileInfo, setField);
                //return true;
              }

            };
            //whether this is a resume upload or not
            let f = yield FileInfo.getFileInfoBySyncId(fileInfo.syncId);
            if (f.progress == 0 && f.checkPoint == '') {
              const result = yield ossClient.multipartUpload(objectKey, filePath, {
                partSize: BLOCK_SIZE,
                progress,
              });
            } else {
              yield ossClient.multipartUpload(objectKey, filePath, {
                partSize: BLOCK_SIZE,
                progress,
                checkpoint: JSON.parse(f.checkPoint),
              });
            }
          }
          else {
            //the file size smaller than block size
            const start = new Date().getTime();
            const result = yield ossClient.put(objectKey, filePath);
            const end = new Date().getTime();
            let fields = {
              progress: 1,
              speed: BLOCK_SIZE / ((end - start) / 1000),
              checkPointTime: end,
              status: FileInfo.FileInfoStatuses.finished,
            }
            Object.assign(fileInfo, fields);
            yield FileInfo.updateFileInfo(fileInfo, fields);
            logger.debug(`uploading ${filePath} to ${objectKey}`);
          }

          return fileInfo;
        }
        catch
          (err) {
          if (err.message == 'upload stop') {
            return fileInfo;
          }
          logger.error(`error when uploading ${filePath} to ${objectKey}`, err);
        }
      }
      while (retry-- > 0);

      throw new Error(`uploading ${filePath} to ${objectKey} failed`);
    }
  )
  .then((fileInfo) => {
    logger.info(`End putOSSObject ${credential.Region} ${credential.Bucket} ${fileInfo.fileId} ${fileInfo.syncId}`);
    return fileInfo;
  })
  .catch((err) => {
    FileInfo.removeFromUnfinishedFileList(fileInfo.syncId);
    FileInfo.updateFileInfo(fileInfo, { status: FileInfo.FileInfoStatuses.failed });
    throw err;
  });
}

export function abortMitiUpload(credential, internal, fileInfo) {
  const ossClient = getOSSClient(credential, internal);
  return co(function*() {
    if (fileInfo.checkPoint) {
      var ckp = JSON.parse(fileInfo.checkPoint);
      var result = yield ossClient.abortMultipartUpload(ckp.name, ckp.uploadId);
      yield FileInfo.updateFileInfo(fileInfo, { status: FileInfo.FileInfoStatuses.aborted });
      logger.info(`Abort putOSSObject name -->${ckp.name}, uploadId--> ${ckp.uploadId}, result-->${result}`);
      return { success: true };
    } else {
      yield FileInfo.updateFileInfo(fileInfo, { status: FileInfo.FileInfoStatuses.aborted });
      return { success: true }
    }
  })
  .catch((err) => {
    if (err.message.indexOf('ENOTFOUND') < 0 && err.message.indexOf('ENOENT') < 0) {
      logger.info(`Abort success with err:${err.message}`);
      FileInfo.updateFileInfo(fileInfo, { status: FileInfo.FileInfoStatuses.aborted });
      return { success: true }
    }
    logger.error(err.message, err.stack);
    return { success: false }
    //FileInfo.setStatusToUnfinishedFileList(fileInfo.syncId, FileInfo.FileInfoStatuses.pausing);
  })
}