import { Router } from 'express';
import { serverApi } from '../services';
const authApi = Router();

function getAuthPage(req, res, next) {
  res.render('auth', { title: 'Auth' });
}
function authorize(req, res, next) {
  let data = req.body;
  serverApi.authenticate(data.username,data.password)
  .then(result =>{
    if(result.data.token) {
      req.session.userId = result.data.currentUser.id;
      req.session.user = result.data.currentUser;
    }
    return res.json(result);
  });
}
function unauthorize(req, res, next) {
  let data = req.body;
  serverApi.deauthenticate()
  .then(result => res.json(result));
}
authApi.get('/',getAuthPage);
authApi.post('/login',authorize);
authApi.post('/logout',unauthorize);

export default authApi;