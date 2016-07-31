import { Router } from 'express';
import { serverApi } from '../services';
const settingApi = Router();

function getSettingPage(req, res, next) {
    res.render('templates/setting', { title: 'Uploader', menu: 'Setting' });
}

function setSettings(req, res, next) {
    res.render('templates/setting', { title: 'Uploader', menu: 'Setting' });
}

function resetSettings(req, res, next) {
    res.render('templates/setting', { title: 'Uploader', menu: 'Setting' });
}
settingApi.get('/',getSettingPage);
settingApi.post('/set',setSettings);
settingApi.post('/reset',resetSettings);

export default settingApi;