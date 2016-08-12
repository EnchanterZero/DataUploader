import { Router } from 'express';
import { dcmAutoPush, uploadSetting } from '../services';
const autoPushApi = Router();

let autoPush = null;
function getAutoPushPage(req, res, next) {
  res.render('templates/autoPush', { title: 'Uploader', menu: 'autoPush' });
}

function startAutoPush(req, res, next) {
  var syncId = new Date().getTime().toString();
  var settings = uploadSetting.getConfig();
  let result = dcmAutoPush.openPort('DCMUPLOADER', settings.PACSServerIP, settings.PACSServerPort, 3000, syncId);
  res.json({
    code: 200,
    data: result,
  });
}

function stopAutoPush(req, res, next) {
  let result = dcmAutoPush.closePort(res);
}

autoPushApi.get('/', getAutoPushPage);
autoPushApi.post('/start', startAutoPush);
autoPushApi.post('/stop', stopAutoPush);

export default autoPushApi;