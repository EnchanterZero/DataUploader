'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.recover = recover;

var _services = require('../services');

var _util = require('../util');

var _co = require('co');

var _co2 = _interopRequireDefault(_co);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const logger = _util.util.logger.getLogger('uploadRecovery');
function recover(uploadingFiles) {
  uploadingFiles.map(item => {
    (0, _co2.default)(function* () {
      yield _services.fileUpload.uploadFiles(null, [], item.syncId, { afterDelete: false });
    });
  });
}