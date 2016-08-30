import models from './db/models';
import { util } from '../util';
const logger = util.logger.getLogger('dicominfo');
import Promise from  'bluebird';

export function getConfig() {
  return models.Config.findAll({})
  .then((result) => {
    let r = {}
    result.map(item => {
      r[item.key] = item.value;
    });
    return r;
  }).catch((err) => {
    logger.error('err:' + err)
  });
}

export function setConfig(settings) {
  let KVPairs = [];
  let successCount = 0;
  for (let key in settings) {
    KVPairs.push({
      key: key,
      value: settings[key],
    })
  }
  console.log(KVPairs);

  return Promise.each(KVPairs, (item)=> {
    return models.Config.update(
      { value: item.value },
      {
        where: {
          key: item.key,
        },
      }, 0)
    .then((result) => {
      successCount++;
      return result;
    }).catch((err) => {
      logger.error(err, err.stack);
    });
  })
  .catch((err) => {
    logger.error(err, err.stack);
  });
}

export const CONFIG_FIELD = {
  GenoServerUrl: 'GenoServerUrl',
}