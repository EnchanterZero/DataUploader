import { Router } from 'express';
const uploadApi = Router();

function getAuthPage(req, res, next) {
  res.render('auth', { title: 'Uploader' });
}
function authorize(req, res, next) {
  res.json({data:'authorize'});
}
function unauthorize(req, res, next) {
  res.json({data:'data'});
}
authApi.get('/',getAuthPage);
authApi.get('/start',authorize);
authApi.get('/stop',unauthorize);

export default uploadApi;