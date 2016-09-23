import { fileUpload } from '../services';
import * as FileInfo from '../modules/fileinfo';
import { util } from '../util';
import co from 'co';
const logger = util.logger.getLogger('uploadRecovery');
export function recover(uploadingFiles) {
  uploadingFiles.map(item=> {
    FileInfo.addToUnfinishedFileList(item);
    if(item.status ==_FileInfo.FileInfoStatuses.pausing ||item.status == _FileInfo.FileInfoStatuses.uploading) {
      co(function*() {
        yield fileUpload.uploadFiles(null, [], item.syncId, { afterDelete: false });
      })
    }
  });
}