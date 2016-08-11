import { Router } from 'express';
import { util } from '../util';
const logger = util.logger.getLogger('settingsApi');
import co from 'co';
import * as Config from '../modules/config';
import { uploadSetting } from '../services'

const settingsApi = Router();

function getSettings(req, res, next) {
  co(function*() {
    let settings = yield Config.getConfig();
    res.json({
      code: 200,
      data: { settings: settings },
    })
  }).catch(err => {
    logger.error(err, err.stack);
  });
}

function setSettings(req, res, next) {
  let data = req.body;
  console.log(data);
  const settings = data.settings;
  const settingsJSON = {
    PACSProvider: settings.PACSProvider,
    PACSServerIP: settings.PACSServerIP,
    PACSServerPort: settings.PACSServerPort,
    ScanInterval: settings.ScanInterval,
    UserValidateURL: settings.UserValidateURL,
    AnonymousMode: settings.AnonymousMode,
  };
  co(function*() {
    yield Config.setConfig(settingsJSON);
    uploadSetting.setConfig(settingsJSON);
    res.json({
      code: 200,
      data: settingsJSON,
    })
  }).catch(err => {
    logger.error(err, err.stack);
  });
}

function resetSettings(req, res, next) {
  res.json({
    code: 200,
    data: {},
  })
}
settingsApi.get('/', getSettings);
settingsApi.post('/set', setSettings);
settingsApi.post('/reset', resetSettings);

export default settingsApi;