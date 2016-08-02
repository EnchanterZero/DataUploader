import { Router } from 'express';
import co from 'co';
import { util } from '../util';
const logger = util.logger.getLogger('historyApi');
import * as DcmInfo from '../modules/dcminfo'
import { serverApi } from '../services';
const historyApi = Router();

function getHistoryPage(req, res, next) {
  res.render('templates/history', { title: 'Uploader', menu: 'History' });
}
function getUploadHistory(req, res, next) {
  const page = req.params.page;
  const count = req.params.count;
  co(function*() {
    let result = yield DcmInfo.listDcmInfo(count, page);
    res.json(
      {
        code: 200,
        data: result,
      });
  }).catch(err => {
    logger.error(err);
  })

}
historyApi.get('/', getHistoryPage);
historyApi.get('/list/:count/:page', getUploadHistory);
export default historyApi;