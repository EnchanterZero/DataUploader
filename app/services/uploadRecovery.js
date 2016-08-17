import { fileUpload } from '../services';
import { util } from '../util';
import co from 'co';
const logger = util.logger.getLogger('uploadRecovery');
export function recover(uploadingFiles) {
  uploadingFiles.map(item=> {
    co(function*() {
      yield fileUpload.uploadFiles([], item.syncId, { afterDelete: false });
    })
  });
}