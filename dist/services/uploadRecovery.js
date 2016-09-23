'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.recover = recover;

var _services = require('../services');

var _fileinfo = require('../modules/fileinfo');

var FileInfo = _interopRequireWildcard(_fileinfo);

var _util = require('../util');

var _co = require('co');

var _co2 = _interopRequireDefault(_co);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

const logger = _util.util.logger.getLogger('uploadRecovery');
function recover(uploadingFiles) {
  uploadingFiles.map(item => {
    FileInfo.addToUnfinishedFileList(item);
    if (item.status == _FileInfo.FileInfoStatuses.pausing || item.status == _FileInfo.FileInfoStatuses.uploading) {
      (0, _co2.default)(function* () {
        yield _services.fileUpload.uploadFiles(null, [], item.syncId, { afterDelete: false });
      });
    }
  });
}