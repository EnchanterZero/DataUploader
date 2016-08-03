import { Router } from 'express';
import { dcmUpload } from '../services';
const autoScanUploadApi = Router();

var AUTOSCAN_DIR = '/Users/intern07/Desktop/dcms/autoscan';
let autoScan = null;

function getAutoScanPage(req, res, next) {
  res.render('templates/autoScanUpload', { title: 'Uploader', menu: 'AutoScan' });
}

function startAutoScan(req, res, next) {
  var syncId = new Date().getTime();
  res.json({
    code: 200,
    data: { syncId: syncId }
  });
  if (!autoScan) {
    autoScan = dcmUpload.startAutoScanUpload(AUTOSCAN_DIR, syncId.toString(), 5000);
  }
}

function stopAutoScan(req, res, next) {
  if (autoScan) {
    autoScan = dcmUpload.stopAutoScanUpload(autoScan);
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