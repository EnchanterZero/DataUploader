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
  let data = req.body;
  const scanDir = data.dir;
  res.json({
    code: 200,
    data: { syncId: syncId }
  });
  if (!autoScan) {
    autoScan = dcmUpload.startAutoScanUpload(scanDir, syncId.toString(), 5000,{afterDelete:false,uploadType:'AutoScanUpload'});
  }
}

function stopAutoScan(req, res, next) {
  if (autoScan) {
    autoScan.on('message',m =>{
      if(m == 'autoUpload stopped'){
        res.json({
          code: 200,
          data: {}
        });
      }
    })
    autoScan = dcmUpload.stopAutoScanUpload(autoScan);
  }
}

autoScanUploadApi.get('/', getAutoScanPage);
autoScanUploadApi.post('/start', startAutoScan);
autoScanUploadApi.post('/stop', stopAutoScan);

export default autoScanUploadApi;