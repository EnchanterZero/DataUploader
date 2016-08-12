import { parseDicom } from './dcmParse';
import * as DcmInfo from '../modules/dcminfo';
import { util } from '../util'
import co from 'co';
function getDiff(UPLOAD_DIR, syncId) {
  return co(function*() {
    const dcmInfosLocal = yield parseDicom(UPLOAD_DIR);
    const dcmsInfosRecord = yield DcmInfo.getDcmInfoBySyncId(syncId, { isSynchronized: true });
    var newDcmInfos = util._.differenceBy(dcmInfosLocal, dcmsInfosRecord, 'dcmPath');
    var dupulicatedDcmInfos = util._.differenceBy(dcmInfosLocal, newDcmInfos, 'dcmPath');

    var newDcmPaths = newDcmInfos.map((item) => {
      return item.dcmPath;
    });
    var dupulicatedDcmPaths = dupulicatedDcmInfos.map((item) => {
      return item.dcmPath;
    });
    newDcmPaths = newDcmPaths ? newDcmPaths : [];
    return {
      newDcmPaths: newDcmPaths,
      newDcmInfos: newDcmInfos,
      dupulicatedDcmPaths: dupulicatedDcmPaths,
      dupulicatedDcmInfos: dupulicatedDcmInfos,
    };
  });
}
export { getDiff }