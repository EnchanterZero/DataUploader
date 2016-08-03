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
import * as DcmInfo from '../dcminfo';

export function getOSSClient(credential,internal) {
  return new OSS({
    secure: internal,
    region: credential.Region,
    accessKeyId: credential.AccessKeyId,
    accessKeySecret: credential.AccessKeySecret,
    stsToken: credential.Security,
    bucket: credential.Bucket,
  });
}

function putOSSDcmFile(ossClient ,dcmInfo, retry = 2) {
  const filepath = dcmInfo.dcmPath;
  const objectKey = path.join(dcmInfo.fileId, dcmInfo.SOPInstanceUID);
  logger.info('putting OSS DcmFile : ', objectKey, filepath);
  return co(function *() {
    do {
      try {
        const fileSize = yield util.size(filepath);
        if (fileSize > 1024 * 1024) {
          const progress = function* (p, cpt) {
            logger.debug(`uploading ${filepath} to ${objectKey}, progress: ${p}`);
          }
          const result = yield ossClient.multipartUpload(objectKey, filepath, {
            partSize: 1024 * 1024,
            progress,
          });
        } else {
          const result = yield ossClient.put(objectKey, filepath);
          logger.debug(`uploading ${filepath} to ${objectKey}`);
        }
        if (filepath.endsWith('.stl')) {
          const copyresult = yield ossClient.copy(objectKey, objectKey, {
            headers: {
              'Content-Type': 'application/json',
            }
          });
        }
        dcmInfo.isSynchronized = true;
        return dcmInfo;
      } catch(err) {
        logger.error(`error when uploading ${filepath} to ${objectKey}`, err);
      }
    } while(retry-- > 0);

    throw new Error(`uploading ${filepath} to ${objectKey} failed`);
  });
}
/**
 * 
 * @param credential {object} from API Server
 * @param internal {boolean}
 * @param dcmInfos {array} Array of DcmInfo
 * @param options {object} options.afterDelete: default false
 * @returns none 
 */
export function putOSSDcms(credential, internal, dcmInfos,options) {
  logger.info('getOSSObject internal =', internal);
  let afterDelete = false;
  if(options && options.afterDelete === true) {
    afterDelete = true;
  }
  logger.info('getOSSObject options.afterDelete =', afterDelete);
  const client = getOSSClient(credential, internal);
  let fileIds = _.uniq(dcmInfos.map((item) =>{
    return item.fileId
  }));
  if (fileIds.length > 1){
    throw new Error('file id duplicated');
  }
  logger.info(`Start putOSSObject ${credential.Region} ${credential.Bucket} ${fileIds[0]} `);

  return util.parallelReduce(dcmInfos, 4, (dcmInfo) => {

      return putOSSDcmFile(client, dcmInfo)
      .then((dcmInfo) =>{
        return co(function* () {
          yield DcmInfo.updateDcmInfoSync(dcmInfo);
          logger.info('update DcmInfo Synchronized : ', dcmInfo.SOPInstanceUID,dcmInfo.syncId);
          if(afterDelete){
            yield util.remove(dcmInfo.dcmPath);
            logger.info('remove temp DcmInfo : ', dcmInfo.dcmPath ,dcmInfo.syncId);
          }
          
        });
      })
      .catch((err) =>{
        logger.error(err);
      });
    }).then(() => {
      logger.info(`End putOSSObject ${credential.Region} ${credential.Bucket} ${fileIds[0]} ${dcmInfos[0].syncId}`);
    });
}