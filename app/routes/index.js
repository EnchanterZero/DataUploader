import express from 'express';

import authapi from './auth';
import manualUploadApi from './manualUpload';
import uploadStatusApi from './uploadStatus';
import settingsApi from './settings';

var api = express.Router();

//api.use('/', manualUploadApi);
//api.use('/index', manualUploadApi);

api.use('/auth', authapi);
api.use('/manualUpload', manualUploadApi);
api.use('/uploadStatus', uploadStatusApi);
api.use('/settings',settingsApi);

export default api;
