import models from './db/models';
import { sequelize } from '../modules/db';
import { util } from '../util';
const logger = util.logger.getLogger('dicominfo');
import Promise from  'bluebird';

/**
 * All columns fields of DcmInfo
 *
 * PatientName
 * PatientID
 * StudyInstanceUID
 * SeriesInstanceUID
 * SOPInstanceUID
 * fileId
 * dcmPath
 * syncId
 * uploadType
 * updatedAt
 * createdAt
 */
export function createDcmInfo(dcmInfo) {
  return models.DcmInfo.findOrCreate({
    where: {
      SOPInstanceUID: dcmInfo.SOPInstanceUID,
      dcmPath: dcmInfo.dcmPath,
      syncId: dcmInfo.syncId,
    },
    defaults: dcmInfo
  }).then((result) => {
    let [rs,created] = result;
    return created;
  }).catch((err) => {
    logger.error('err:' + err)
  });
}

export function createMiltiDcmInfo(dcmInfoArr) {
  let succeedItems = [];
  let failedItems = [];
  let queue = dcmInfoArr.map((dcmInfo) => {
    return models.DcmInfo.findOrCreate({
      where: {
        SOPInstanceUID: dcmInfo.SOPInstanceUID,
        dcmPath: dcmInfo.dcmPath,
        syncId: dcmInfo.syncId,
      },
      defaults: dcmInfo
    }).then((result) => {
      let [rs,created] = result;
      if (created) succeedItems.push(dcmInfo);
      else failedItems.push(dcmInfo);
    }).catch((err) => {
      failedItems.push(dcmInfo);
      logger.error('err:' + err)
    });
  });
  return Promise.reduce(queue)
  .then(() => {
    return {
      succeedItems: succeedItems,
      failedItems: failedItems
    }
  }).catch((err) => {
    logger.error('err:' + err)
  });
}

export function deleteAllDcmInfos() {
  return models.DcmInfo.destroy()
  .then((result) => {
  }).catch((err) => {
    logger.error('err:' + err)
  });
}

export function updateDcmInfoSync(dcmInfo) {
  return models.DcmInfo.findOne({
    where: {
      SOPInstanceUID: dcmInfo.SOPInstanceUID,
      dcmPath: dcmInfo.dcmPath,
      syncId: dcmInfo.syncId,
    }
  })
  .then((result) => {
    if (result) {
      return models.DcmInfo.update({ isSynchronized: true }, {
        where: {
          SOPInstanceUID: dcmInfo.SOPInstanceUID,
          dcmPath: dcmInfo.dcmPath,
          syncId: dcmInfo.syncId,
        }
      })
    } else {
      throw ["no such dcmInfo", dcmInfo];
    }
  })
  .then((result) => {
    if (!result[0]) {
      logger.error('err: ' + 'update failed', dcmInfo)
    }
  })
  .catch((err) => {
    logger.error('err:', err)
  });
}

export function getDcmInfoBySyncId(SyncId, options) {
  let where = { SyncId: SyncId };
  if (options && options.isSynchronized === true) {
    where.isSynchronized = true;
  }
  if (options && options.isSynchronized === false) {
    where.isSynchronized = false;
  }
  return models.DcmInfo.findAll({
    where: where
  })
  .then((results) => {
    return results;
  })
  .catch((err) => {
    logger.error('err:', err)
  });

}

export function countDcmInfoBySyncId(SyncId) {
  var result = {};
  return models.DcmInfo.findAndCountAll({
    where: {
      SyncId: SyncId,
      isSynchronized: true
    }
  })
  .then((r) => {
    result.success = r;
  })
  .then(() => {
    return models.DcmInfo.findAndCountAll({
      where: {
        SyncId: SyncId,
        isSynchronized: false
      },
    })
  })
  .then((r) => {
    result.failed = r;
    return result;
  })
  .catch((err) => {
    logger.error('err:', err)
  });
}

export function listDcmInfo(count, page) {
  let result = {};
  return sequelize.query(`select id,PatientID,PatientName,StudyInstanceUID,fileId,syncId,updatedAt,count(StudyInstanceUID) as num ` +
    `from DcmInfos ` +
    `group by syncId,StudyInstanceUID ` +
    `order by updatedAt DESC,syncId DESC ` +
    `limit ${count} ` +
    `offset ${count * (page - 1)};`,
    { type: sequelize.QueryTypes.SELECT })
  .then(r => {
    result.uploadList = r;
    return sequelize.query('select count(*) as num from (select * from DcmInfos group by syncId,StudyInstanceUID);',
      { type: sequelize.QueryTypes.SELECT }
    )
  }).then(r => {
    result.total = r[0].num;
    return result;
  });
}

export function listUploadingDcmInfo() {
  let result = {};
  return sequelize.query('select PatientID,PatientName,StudyInstanceUID,fileId,syncId,total,success from ' +
    '(select *,count(StudyInstanceUID) as total, sum(isSynchronized) as success from DcmInfos group by syncId,StudyInstanceUID) ' +
    'where total != success ' +
    'order by updatedAt DESC,syncId DESC;',
    { type: sequelize.QueryTypes.SELECT })
  .then(r => {
    result.uploadingList = r;
    return result;
  });
}
