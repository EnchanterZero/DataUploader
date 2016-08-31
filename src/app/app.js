//require backend services
var _BackendService = require('../../dist/services');
var _FileInfo = require('../../dist/modules/fileinfo');
var _Config = require('../../dist/modules/config');
var _util = require('../../dist/util');
var logger = _util.util.logger.getLogger('frontEnd');
logger.debug('123123');
var co = require('co');