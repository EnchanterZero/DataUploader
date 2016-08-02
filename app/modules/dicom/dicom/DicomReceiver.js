import * as cp from 'child_process';
import path from 'path';
import { util } from '../../../util';
import { projectConfig } from '../../../config';
const logger = util.logger.getLogger('DicomReceiver');

var EXEC_PATH = path.join(path.dirname(projectConfig.projectRoot) ,'/dcm4che-3.3.7');
var TEMP_PATH = path.join(path.dirname(projectConfig.projectRoot) ,'/dcmTempDir');
var RECEIVE_PORT = 11112;
var AE_TITLE = 'DCMUPLOADER';

var receiver = null;

function openPort() {
  //storescp -b DCM4CHEE@localhost:11112 --directory ./tmp
  const cmd = `${EXEC_PATH}/storescp -b ${AE_TITLE}@127.0.0.1:${RECEIVE_PORT} --directory ${TEMP_PATH}`;
  if(!receiver) {
    logger.debug('start the child process and listen Port ' + RECEIVE_PORT);
    receiver = cp.exec(cmd);
  }
}

function closePort() {
  //storescp -b DCM4CHEE@localhost:11112 --directory ./tmp
  if(receiver){
    logger.debug('kill the child process and close Port ' + RECEIVE_PORT);
    receiver.kill();
  }
}

export { openPort,closePort }