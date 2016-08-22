import { util } from '../util';
import * as cp from 'child_process';
const logger = util.logger.getLogger('upload');
import { serverApi, dcmDiff, } from '../services';
import * as DcmInfo from '../modules/dcminfo'
import * as OSS from '../modules/oss'
import * as chokidar from 'chokidar';
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

function uploadDiomsByStudy(StudyInstanceUID, dcmInfos, options) {

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
    for (let i in dcmInfos) {
      let result2 = yield DcmInfo.createDcmInfo(dcmInfos[i]);
      console.log(result2);
    }
    console.log('start upload!!!!!!!!!')
    //upload
    yield OSS.putOSSDcms(ossCredential, false, dcmInfos, options);
  });
}


function uploadDicoms(dcmInfos, sId, options) {
  var syncId = sId ? sId : new Date().getTime().toString();
  dcmInfos.map((item) => {
    item.syncId = syncId;
  });
  var uploadSequence = util._.groupBy(dcmInfos, 'StudyInstanceUID');
  return co(function*() {
    for (var key in uploadSequence) {
      logger.debug('---------->' + key);
      yield uploadDiomsByStudy(key, uploadSequence[key], options ? options : {});
    }
    return {
      dcmInfos: dcmInfos,
      syncId: syncId,
    };
  }).catch(err => {
    logger.error(err);
  });
}

function autoScanUpload(dir, syncId, token, option) {
  if (!dir || !syncId || !token) {
    throw new Error(`Auto Scan Upload Arg Error: token=${token},syncId=${syncId},dir=${dir}`);
    return;
  }
  let _dir = dir;
  let _syncId = syncId;
  let _token = token;
  let _delayTime = option.delayTime ? option.delayTime : 5000;
  let _afterDelete = option.afterDelete ? option.afterDelete : false;
  let _uploadType = option.uploadType ? option.uploadType : '';

  let ready = false;
  let working = false;
  let stopping = false;
  let response = null;
  logger.debug(`start watch ---> interval: ${_delayTime}`);
  var watcher = chokidar.watch(dir, {
    //persistent: true
    interval: _delayTime,
    depth: 25,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });
  watcher.on('ready', () => {
    ready = true;
    logger.debug('Initial scan complete. Ready for changes');
  });
  watcher.on('add', (path) => {
    logger.debug(`new Path : ${path}`);
    if (!working) {
      working = true;
      co(function*() {
        logger.debug('[autoScan]--------new round of auto scan');
        //get diff
        var result = yield dcmDiff.getDiff(_dir, _syncId);
        var newDcmPaths = result.newDcmPaths;
        var newDcmInfos = result.newDcmInfos;
        var dupulicatedDcmPaths = result.dupulicatedDcmPaths;
        logger.debug('[autoScan]--------find new dicom file: ' + newDcmPaths.length, newDcmPaths);
        //remove duplicated dcms if they came from pushing port
        if(_afterDelete) {
          for(let i in dupulicatedDcmPaths) {
            yield util.remove(dupulicatedDcmPaths[i]);
          }
        }
        //upload
        if (newDcmPaths.length > 0) {
          logger.debug('[autoScan]--------upload new dicom file...... ');
          yield uploadDicoms(newDcmInfos, _syncId, { afterDelete: _afterDelete, uploadType: _uploadType });
        }
        // //delay
        // yield Promise.delay(10000);
        logger.debug('[autoScan]--------this round finished. \n');
        watcher.emit('One Round Finish');
        working = false;
      }).catch((err)=> {
        console.log(err, err.stack);
      });
    }
  });
  watcher.once('AutoScanUpload Stop', (res)=> {
    if (working) {
      logger.debug('[autoScan]--stopping...');
      response = res;
      stopping = true;
    } else {
      watcher.close();
      watcher.removeAllListeners();
      res.json({
        code: 200,
        data: {}
      });
      logger.debug('[autoScan]--stopped...');
    }
  });
  watcher.on('One Round Finish', ()=> {
    if (stopping) {
      watcher.close();
      watcher.removeAllListeners();
      response.json({
        code: 200,
        data: {}
      });
      logger.debug('[autoScan]--stopped...');
    }
  });

  return watcher;

}


/**
 *
 * @param uploadDir
 * @param syncId
 * @param delayTime {Number}
 * @param option {Object}
 */
function startAutoScanUpload(uploadDir, syncId, option) {
  console.log('startAutoScanUpload-------------------------------------->', option)
  let token = serverApi.getBaseAuthToken();
  if (!token) {
    throw new Error('AUTO SCAN NO TOKEN');
    return;
  }
  let afterDelete = false;
  let uploadType = '';
  let delayTime = 5000;
  if (option && option.afterDelete === true) {
    afterDelete = true;
  }
  if (option && option.uploadType) {
    uploadType = option.uploadType;
  }
  if (option && option.delayTime) {
    delayTime = option.delayTime;
  }

  let autoScan = autoScanUpload(uploadDir, syncId, token,
    {
      afterDelete: afterDelete,
      uploadType: uploadType,
      delayTime: delayTime,
    });
  return autoScan;
}

function stopAutoScanUpload(autoScan, res) {
  // autoScan.send('stop');
  var watchedPaths = autoScan.getWatched();
  logger.debug('watchedPaths : ', watchedPaths);
  autoScan.emit('AutoScanUpload Stop', res);
  return null;
}

export {
  setInternal,
  uploadDicoms,
  startAutoScanUpload,
  stopAutoScanUpload,
}