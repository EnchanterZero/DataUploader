import { Router } from 'express';
import { dcmUpload } from '../services';
const autoScanUploadApi = Router();

var AUTOSCAN_DIR = '/Users/intern07/Desktop/dcms/autoscan';
let autoScan = null;

function getAutoScanPage(req, res, next) {
  res.render('templates/autoScanUpload', { title: 'Uploader', menu: 'AutoScan' });
}

function startAutoScan(req, res, next) {
  var transportId = new Date().getTime();
  res.json({
    code: 200,
    data: { syncId: transportId }
  });
  if (!autoScan) {
    autoScan = dcmUpload.startAutoScanUpload(AUTOSCAN_DIR, transportId.toString(), 5000);
  }
}

function stopAutoScan(req, res, next) {
  if (autoScan) {
    dcmUpload.stopAutoScanUpload(autoScan);
    autoScan = null;
  }
  res.json({
    code: 200,
    data: {}
  });
}

autoScanUploadApi.get('/', getAutoScanPage);
autoScanUploadApi.post('/start', startAutoScan);
autoScanUploadApi.post('/stop', stopAutoScan);

export default autoScanUploadApi;