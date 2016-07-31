import { Router } from 'express';
import { serverApi } from '../services';
const historyApi = Router();

function getHistoryPage(req, res, next) {
    res.render('auth', { title: 'Uploader', menu:'History' });
}
function authorize(req, res, next) {
    res.json({data:'authorize'});
}
function unauthorize(req, res, next) {
    res.json({data:'data'});
}
historyApi.get('/',getHistoryPage);

export default historyApi;