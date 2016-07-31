import { parseDicom } from './dcmParse';
import * as DcmInfo from '../modules/dcminfo';
import { util } from '../util'
import co from 'co';
function getDiff(UPLOAD_DIR, transportId) {
  return co(function* () {
    var dcmInfosLocal = yield parseDicom(UPLOAD_DIR);
    var dcmsInfosRecord = yield DcmInfo.getDcmInfoBySyncId(transportId);
    var newDcmInfos = util._.differenceBy(dcmInfosLocal, dcmsInfosRecord,'dcmPath');
    console.log('dcmInfosLocal.length : ' + dcmInfosLocal.length);
    console.log('dcmsInfosRecord.length : ' + dcmsInfosRecord.length);
    console.log('newDcmInfos.length : ' + newDcmInfos.length);
    var newDcmPaths = newDcmInfos.map((item) => {
      return item.dcmPath;
    });
    console.log('newDcmPaths.length : ' + newDcmPaths.length);
    newDcmPaths = newDcmPaths?newDcmPaths:[];
    return {newDcmPaths:newDcmPaths, newDcmInfos:newDcmInfos};
  });
}
export { getDiff }