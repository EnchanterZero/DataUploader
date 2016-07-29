import { Router } from 'express';
import { serverApi } from '../services';
const authApi = Router();

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
authApi.get('/login',authorize);
authApi.get('/logout',unauthorize);

export default authApi;