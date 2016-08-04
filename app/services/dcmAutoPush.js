import { dcmUpload } from '../services';
import * as cp from 'child_process';
import path from 'path';
import { util } from '../util';
import { projectConfig } from '../config';
const logger = util.logger.getLogger('dcmAutoPush');

var EXEC_PATH = path.join(path.dirname(projectConfig.projectRoot) ,'/dcm4che-3.3.7/bin');
var TEMP_PATH = path.join(path.dirname(projectConfig.projectRoot) ,'/dcmTempDir');
var RECEIVE_PORT = 11112;
var AE_TITLE = 'DCMUPLOADER';

var receiver = null;
var autoScan = null;
var syncId = '';
function openPort() {
  //storescp -b DCM4CHEE@localhost:11112 --directory ./tmp
  const cmd = `${EXEC_PATH}/storescp`;
  const args = ['-b', `${AE_TITLE}@127.0.0.1:${RECEIVE_PORT}`,'--directory', `${TEMP_PATH}`];
  if(!receiver && !autoScan) {
    //start child process to receive
    logger.debug('start the child process and listen Port ' + RECEIVE_PORT);
    receiver = cp.spawn(cmd, args);
    receiver.stdout.on('data',(data)=>{
      console.log(data.toString());
    });
    receiver.stderr.on('data',(data)=>{
      console.log(data.toString());
    });
    receiver.on('error',(error)=>{
      console.log(error);
    });
    receiver.on('exit',()=>{
      console.log('EXIT');
    });
    
    //start child process to autoScan
    syncId = new Date().getTime();
    autoScan = dcmUpload.startAutoScanUpload(TEMP_PATH, syncId, 5000, {afterDelete:true,uploadType:'AutoPushUpload'});

    return {
      status:'opened',
      syncId:syncId,
    };
  }
}

function closePort(res) {

  if(receiver && autoScan){
    logger.debug('kill the child process and close Port ' + RECEIVE_PORT);
    receiver.kill();
    receiver.removeAllListeners('data');
    receiver.removeAllListeners('error');
    receiver.removeAllListeners('exit');
    receiver = null;
    autoScan.on('message',m =>{
      if(m == 'autoUpload stopped'){
        res.json({
          code: 200,
          data: {}
        });
      }
    });
    autoScan = dcmUpload.stopAutoScanUpload(autoScan);

    return {
      status:'closed',
    };
  }else{
    return {
      status:'opened',
    };
  }

}

export { openPort,closePort }