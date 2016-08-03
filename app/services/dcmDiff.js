import { parseDicom } from './dcmParse';
import * as DcmInfo from '../modules/dcminfo';
import { util } from '../util'
import co from 'co';
function getDiff(UPLOAD_DIR, syncId) {
  return co(function*() {
    var dcmInfosLocal = yield parseDicom(UPLOAD_DIR);
    var dcmsInfosRecord = yield DcmInfo.getDcmInfoBySyncId(syncId);
    var newDcmInfos = util._.differenceBy(dcmInfosLocal, dcmsInfosRecord, 'dcmPath');
    var newDcmPaths = newDcmInfos.map((item) => {
      return item.dcmPath;
    });
    newDcmPaths = newDcmPaths ? newDcmPaths : [];
    return { newDcmPaths: newDcmPaths, newDcmInfos: newDcmInfos };
  });
}
export { getDiff }