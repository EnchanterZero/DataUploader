import { Router } from 'express';
import { serverApi,dcmParse,dcmUpload } from '../services';
const autoScanApi = Router();

let autoScan = null;
function getAutoScanPage(req, res, next) {
    res.render('templates/autoScanUpload', { title: 'Uploader', menu: 'AutoScan' });
}
function startAutoScan(req, res, next) {
    var transportId = new Date().getTime();
    if (!autoScan) {
      autoScan = dcmapi.startAutoScan(AUTOSCAN_DIR, transportId.toString());
    }
  res.json({
    code: 200,
    data: {}
  });
}
function stopAutoScan(req, res, next) {
  var transportId = new Date().getTime();
  if (autoScan) {
    dcmapi.stopAutoScan(autoScan);
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