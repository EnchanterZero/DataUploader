import { Router } from 'express';
import { dcmAutoScan } from '../services';
import { util } from '../util';
const logger = util.logger.getLogger('autoscanUpload');
import * as  Config from '../modules/config';
import co from 'co';
const autoScanUploadApi = Router();

var AUTOSCAN_DIR = '/Users/intern07/Desktop/dcms/autoscan';


function startAutoScan(req, res, next) {
  var syncId = new Date().getTime().toString();
  let data = req.body;
  const scanDir = data.dir;
  co(function*() {
    let isDir = yield util.isDirectory(scanDir);
    console.log('scanDir:' + scanDir);
    if (isDir) {
      let settings = {}
      settings[Config.CONFIG_FIELD.ScanDir] = scanDir;
      yield Config.setConfig(settings);
      dcmAutoScan.startScan(scanDir, syncId);
      res.json({
        code: 200,
        data: { syncId: syncId }
      });
    } else {
      res.json({
        code: 701,
        data: {
          studies: null,
          dcmInfos: null,
          failed: 'not such Directory',
        }
      });
    }
  }).catch(err=> {
    logger.error(err);
  });
}

function stopAutoScan(req, res, next) {
  dcmAutoScan.stopScan(res);
}

autoScanUploadApi.post('/start', startAutoScan);
autoScanUploadApi.post('/stop', stopAutoScan);

export default autoScanUploadApi;