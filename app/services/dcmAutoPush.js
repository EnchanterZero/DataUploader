import { dcmUpload } from '../services';
import * as cp from 'child_process';
import * as Status from '../modules/status';
import path from 'path';
import { util } from '../util';
import { projectConfig } from '../config';
const logger = util.logger.getLogger('dcmAutoPush');

const DEFAULT_EXEC_PATH = path.join(path.dirname(projectConfig.projectRoot), '/dcm4che-3.3.7/bin');
const DEFAULT_TEMP_PATH = path.join(path.dirname(projectConfig.projectRoot), '/dcmTempDir');
const DEFAULT_RECEIVE_IP = '127.0.0.1'
const DEFAULT_RECEIVE_PORT = 11112;
const DEFAULT_AE_TITLE = 'DCMUPLOADER';
const DEFAULT_INTERVAL = 5000;

var receiver = null;
var working_port;
var autoScan = null;
process.on('beforeExit',()=>{
  console.log('beforeExit');
});
process.on('exit',()=>{
  if(receiver){
    receiver.kill();
  }
  console.log('exit');
});
function openPort(aet, ip, port, interval, syncId) {
  try {
    let AE_TITLE = aet ? aet : DEFAULT_AE_TITLE;
    let IP = ip ? ip : DEFAULT_RECEIVE_IP;
    let PORT = port ? port : DEFAULT_RECEIVE_PORT;
    let INTERVAL = Number(interval) ? Number(interval) : DEFAULT_INTERVAL;

    Status.updateStatus(Status.UPLOAD_TYPE.AutoPushUpload,syncId);

    //storescp -b DCM4CHEE@localhost:11112 --directory ./tmp
    const cmd = `${DEFAULT_EXEC_PATH}/storescp`;
    const args = ['-b', `${AE_TITLE}@${IP}:${PORT}`, '--directory', `${DEFAULT_TEMP_PATH}`];
    if (!receiver && !autoScan) {
      //start child process to receive
      logger.debug(`start the child process and listen Port ${PORT} ---> ${cmd}`);
      working_port = PORT;
      receiver = cp.spawn(cmd, args);
      receiver.stdout.on('data', (data)=> {
        console.log(data.toString());
      });
      receiver.stderr.on('data', (data)=> {
        console.log(data.toString());
      });
      receiver.on('error', (error)=> {
        console.log(error);
      });
      receiver.on('exit', ()=> {
        console.log('EXIT');
      });

      //start child process to autoScan
      autoScan = dcmUpload.startAutoScanUpload(DEFAULT_TEMP_PATH, syncId, {
        afterDelete: true,
        uploadType: 'AutoPushUpload',
        delayTime: INTERVAL
      });

      return {
        status: 'opened',
        syncId: syncId,
      };
    }
  } catch (err) {
    logger.error(err, err.stack);
    return {
      status: 'closed'
    };
  }
}

function closePort(res) {

  if (receiver && autoScan) {
    logger.debug('kill the child process and close Port ' + working_port);
    receiver.kill();
    receiver.removeAllListeners('data');
    receiver.removeAllListeners('error');
    receiver.removeAllListeners('exit');
    receiver = null;

    autoScan = dcmUpload.stopAutoScanUpload(autoScan, res);

    Status.updateStatus(Status.UPLOAD_TYPE.AutoPushUpload,'');

    return {
      status: 'closed',
    };
  } else {
    return {
      status: 'opened',
    };
  }

}

export { openPort, closePort }