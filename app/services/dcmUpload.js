import { util } from '../util';
const logger = util.logger.getLogger('upload');
import Promise from 'bluebird';
import co from 'co';
import request from 'request';

let internal;

function setInternal(val) {
  logger.debug('setInternal', val);
  internal = val;
}

function createFile(filepath, name, type, meta) {
  console.log('createFile');
  console.log(JSON.stringify(meta))
}

function uploadDiomsToOne(dcmInfos) {
  var syncId = new Date().getTime().toString();
  dcmInfos.map((item) =>{
    item.syncId = syncId;
  });
  /**
   * create file
   */
  /**
   * ask for token
   */
  /**
   * upload
   */
  
  
  console.log(JSON.stringify(meta))
}
function uploadDioms(dcmInfos) {
  var syncId = new Date().getTime().toString();
  dcmInfos.map((item) =>{
    item.syncId = syncId;
  });
  /**
   * cre
   */


  console.log(JSON.stringify(meta))
}

export {
  setInternal,
  uploadDioms,
}