import { Router } from 'express';
import { dcmAutoScan } from '../services';
const autoScanUploadApi = Router();

var AUTOSCAN_DIR = '/Users/intern07/Desktop/dcms/autoscan';



function startAutoScan(req, res, next) {
  var syncId = new Date().getTime().toString();
  let data = req.body;
  const scanDir = data.dir;
  dcmAutoScan.startScan(scanDir, syncId);
  res.json({
    code: 200,
    data: { syncId: syncId }
  });
}

function stopAutoScan(req, res, next) {
  dcmAutoScan.stopScan(res);
}

autoScanUploadApi.post('/start', startAutoScan);
autoScanUploadApi.post('/stop', stopAutoScan);

export default autoScanUploadApi;