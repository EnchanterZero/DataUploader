import { util } from '../util';
import path from 'path';
const logger = util.logger.getLogger('upload');
import Promise from 'bluebird';
import request from 'request';

let baseUserToken;
let baseUser;
let baseUrl;

function GET(serverUrl, uri, query, option) {
  let req = {
    uri: serverUrl + util._.trim(uri),
    method: 'GET',
    qs: query,
    headers: {},
  }
  if (option && option.headers) {
    Object.assign(req.headers, option.headers)
  }
  logger.debug('GET', uri, req);
  return new Promise(function (resolve, reject) {
    request(req, function (err, res, body) {
      if (err) {
        logger.debug('err when getting',err, res, body);
        return reject(err);
      }
      try {
        body = JSON.parse(body);
        if (body.code !== 200) {
          return reject(body.message);
        }
        resolve(body);
      } catch (err) {
        logger.debug(err, res, body);
        reject(err);
      }
    });
  });
}

function POST(serverUrl, uri, body, option) {
  let req = {
    uri: serverUrl + util._.trim(uri),
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    }
  }
  if (option && option.headers) {
    Object.assign(req.headers, option.headers)
  }
  logger.debug('POST', uri, req);
  return new Promise(function (resolve, reject) {
    request(req, function (err, res, body) {
      if (err) {
        logger.debug('err when postting',err, res, body);
        return reject(err);
      }
      try {
        body = JSON.parse(body);
        if (body.code !== 200) {
          return reject(body);
        }
        resolve(body);
      } catch (err) {
        logger.debug(err, res, body);
        reject(err);
      }
    });
  });
}

function PATCH(serverUrl, uri, body, option) {
  let req = {
    uri: serverUrl + util._.trim(uri),
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    }
  }
  if (option && option.headers) {
    Object.assign(req.headers, option.headers)
  }
  logger.debug('GET', uri, req);
  return new Promise(function (resolve, reject) {
    request(req, function (err, res, body) {
      if (err) {
        return reject(err);
      }
      try {
        body = JSON.parse(body);
        if (body.code !== 200) {
          return reject(body);
        }
        resolve(body);
      } catch (err) {
        logger.debug(err, res, body);
        reject(err);
      }
    });
  });
}

function setServerUrl(url) {
  logger.debug('setServerUrl', url);
  baseUrl = url;
}
//function setAuthToken(token) -> function setBaseAuthToken(token)
function setBaseAuthToken(token) {
  logger.debug('set Base AuthToken', token);
  baseUserToken = token;
}
//function getAuthToken(token) -> function getBaseAuthToken(token)
function getBaseAuthToken() {
  return baseUserToken;
}
function setBaseUser(user) {
  logger.debug('set Base User', user);
  baseUser = user;
}
//function getAuthToken(token) -> function getBaseAuthToken(token)
function getBaseUser() {
  return baseUser;
}

function authorize(options) {
  var token = getBaseAuthToken();
  if (!token) {
    throw new Error('NO TOKEN!');
  } else {
    if (options.headers)
      options.headers['x-GENO-Auth-Token'] = token;
    else {
      options.headers = { 'x-GENO-Auth-Token': token }
    }
  }
}

function checkStatusCode(result) {
  logger.debug(result);
  if (!result) {
    throw new Error('empty response');
  }
  if (result.code === 1001) {
    throw new Error('invalidToken ' + result.data.code);
    setBaseAuthToken(null);
  }
  if (result.code !== 200) {
    throw new Error('code ' + result.data.code);
  }
  return result.data;
}

function authenticate(username, password) {
  const baseAuth = POST(baseUrl, '/user/authenticate', {
    username,
    password,
  });
  return Promise.all([baseAuth])
  .then(results => {
    //logger.debug('123123123',results);
    if (results[0].data.token) {
      setBaseAuthToken(results[0].data.token);
      setBaseUser(results[0].data.currentUser);
    }
    return results[0]
  })
}

function deauthenticate() {
  let options = {};
  authorize(options);
  const baseDeauth = GET(baseUrl, '/user/deauthenticate', {}, {});
  return Promise.all([baseDeauth])
  .then(results => {
    logger.debug('result', results[0]);
    setBaseAuthToken(null);
    setBaseUser(null);
    return results[0]
  })
}

function getGenoProjects() {
  let options = {}
  authorize(options);
  return GET(baseUrl, '/projects', null, options)
  .then(checkStatusCode)
  .then(result => {
    return result.projects;
  })
  /*.catch(err=>{
    logger.debug('123123123123123',err);
    throw err;
  })*/
}
/**
 *
 * @param projectId
 * @param options {Object} {fileName:String , size : Number}
 * @returns {*}
 */
function createFile(projectId, data) {

  let fileObj = {
    name: `${data.fileName}-${data.syncId}`,
    id: `${data.fileName}-${data.syncId}`,
    filePath: path.join(projectId,`${data.fileName}-${data.syncId}`)
  }
  return Promise.resolve(fileObj);

  //here create file record on geno server
  // let options = {};
  // authorize(options);
  // return POST(baseUrl, `/projects/${projectId}/files`, data, options)
  // .then(checkStatusCode)
  // .then(result => {
  //   logger.debug('created file!', result.fileObj);
  //   return result.fileObj;
  // })
}

function getOSSToken(projectId, fileId) {
  //here get oss token from geno server
  return Promise.resolve({
    AccessKeyId: "wzDyN0BDsEl2JmgW",
    AccessKeySecret: "CUjn2POzoVD0cqhnYDfYqutEcYupLJ",
    Bucket: "curacloud-geno-test",
    Expiration: "",
    Region: "oss-cn-qingdao",
    Security: "",
  });
  // let options = {}
  // authorize(options);
  // return GET(baseUrl, `/projects/${projectId}/files/${fileId}/osstoken`, null, options)
  // .then(checkStatusCode)
  // .then(result => {
  //   logger.debug('got osstoken!', result.credential);
  //   return result.credential;
  // })
}
function updateUploadPercentage(projectId, fileId, data) {
  let options = {};
  authorize(options);
  return PATCH(baseUrl, `/projects/${projectId}/files/${fileId}/uploadpercent`, data, options)
  .then(checkStatusCode)
  .then(result => {
    logger.debug('updated Upload Percentage!', result.fileObj);
    return result.fileObj;
  })
}

export {
  setBaseAuthToken,
  getBaseAuthToken,
  setBaseUser,
  getBaseUser,
  setServerUrl,
  authenticate,
  deauthenticate,
  createFile,
  getOSSToken,
  getGenoProjects,
  updateUploadPercentage,
}