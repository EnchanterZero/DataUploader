import models from './db/models';
import { util } from '../util';
const logger = util.logger.getLogger('status');
import Promise from  'bluebird';

export function getStatus() {
  return models.Status.findAll({})
  .then((result) => {
    let r = {}
    result.map(item => {
      r[item.key] = item.value;
    });
    return r;
  }).catch((err) => {
    logger.error('err:' , err)
  });
};

export const UPLOAD_TYPE = {
  ManualUpload: 'ManualUpload',
  AutoScanUpload: 'AutoScanUpload',
  AutoPushUpload: 'AutoPushUpload',
};
/**
 *
 * @param name :
  * @returns {*|Promise.<T>}
 */
export function updateStatus(name, syncId) {
  return models.Status.update({ value: syncId ? syncId : '' },
    {
      where: { key: name }
    })
  .then((r) => {
    return r[0];
  }).catch((err) => {
    logger.error('err:' , err)
  });
}