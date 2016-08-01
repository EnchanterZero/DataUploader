import { util } from '../util';
const logger = util.logger.getLogger('upload');
import { serverApi } from '../services';
import * as DcmInfo from '../modules/dcminfo'
import * as  OSS from '../modules/oss'
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

function uploadDiomsByStudy(StudyInstanceUID, dcmInfos) {

  //console.log(dcmInfos);
  let data = {
    type: 'UploadDcm',
    size: '0',
    hash: 'NONE',
    name: StudyInstanceUID,
    isZip: false
  };
  return co(function*() {
    //create file and ask for token
    let result = yield serverApi.createFile(data);
    let file = result.data.file;
    dcmInfos.map(item => {
      item.fileId = file.id;
    });
    result = yield serverApi.getOSSToken(file.id);
    let ossCredential = result.data.ossCredential;

    // record into sqlite
    for(let i in dcmInfos)
    {
      let result2 = yield DcmInfo.createDcmInfo(dcmInfos[i]);
      console.log(result2);
    }
    //upload
    //OSS.putOSSDcms(ossCredential,false,dcmInfos);
  });
}


function uploadDicoms(dcmInfos) {
  var syncId = new Date().getTime().toString();
  dcmInfos.map((item) => {
    item.syncId = syncId;
  });
  var uploadSequence = util._.groupBy(dcmInfos, 'StudyInstanceUID');
  return co(function*() {
    for (var key in uploadSequence) {
      logger.debug('---------->' + key);
      yield uploadDiomsByStudy(key, uploadSequence[key]);
    }
  }).catch(err => {
    logger.error(err);
  });
}

export {
  setInternal,
  uploadDicoms,
}