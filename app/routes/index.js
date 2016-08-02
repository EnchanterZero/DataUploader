import express from 'express';

import authapi from './auth';
import manualUploadApi from './manualUpload';
import autoscanUploadApi from './autoscanUpload';
import uploadStatusApi from './uploadStatus';
import historyApi from './history';

var api = express.Router();

api.use('/', manualUploadApi);
api.use('/index', manualUploadApi);

api.use('/auth', authapi);
api.use('/manualUpload', manualUploadApi);
api.use('/autoscanUpload', autoscanUploadApi);
api.use('/uploadStatus', uploadStatusApi);
api.use('/history', historyApi);
export default api;
