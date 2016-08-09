import express from 'express';

import authapi from './auth';
import manualUploadApi from './manualUpload';
import autoscanUploadApi from './autoscanUpload';
import uploadStatusApi from './uploadStatus';
import autoPushApi from './autoPush'
import historyApi from './history';
import settingsApi from './settings';

var api = express.Router();

//api.use('/', manualUploadApi);
//api.use('/index', manualUploadApi);

api.use('/auth', authapi);
api.use('/manualUpload', manualUploadApi);
api.use('/autoscanUpload', autoscanUploadApi);
api.use('/uploadStatus', uploadStatusApi);
api.use('/autoPush',autoPushApi);
api.use('/history', historyApi);
api.use('/settings',settingsApi);

export default api;
