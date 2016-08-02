import { Router } from 'express';
import { dcmUpload } from '../services';
const autoPushApi = Router();


function getAutoPushPage(req, res, next) {
  res.render('templates/autoScanUpload', { title: 'Uploader', menu: 'AutoScan' });
}

function startAutoPush(req, res, next) {

}

function stopAutoPush(req, res, next) {
  
}

autoPushApi.get('/', getAutoPushPage);
autoPushApi.post('/start', startAutoPush);
autoPushApi.post('/stop', stopAutoPush);

export default autoPushApi;