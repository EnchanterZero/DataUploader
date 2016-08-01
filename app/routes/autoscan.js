import { Router } from 'express';
import { dcmParse, dcmUpload, serverApi, autoScanUpload, dcmDiff } from '../services';
const autoScanApi = Router();

var AUTOSCAN_DIR = '/Users/intern07/Desktop/dcms/autoscan';
let autoScan = null;
function getAutoScanPage(req, res, next) {
    res.render('templates/autoScanUpload', { title: 'Uploader', menu: 'AutoScan' });
}
function startAutoScan(req, res, next) {
    var transportId = new Date().getTime();
    if (!autoScan) {
      autoScan = autoScanUpload.start(AUTOSCAN_DIR, transportId.toString());
    }
  res.json({
    code: 200,
    data: {}
  });
}
function stopAutoScan(req, res, next) {
  var transportId = new Date().getTime();
  if (autoScan) {
    autoScanUpload.stop(autoScan);
  }
  res.json({
    code: 200,
    data: {}
  });
}

autoScanApi.get('/',getAutoScanPage);
autoScanApi.post('/start',startAutoScan);
autoScanApi.post('/stop',stopAutoScan);

export default autoScanApi;