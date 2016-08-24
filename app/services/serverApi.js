import { util } from '../util';
const logger = util.logger.getLogger('upload');
import Promise from 'bluebird';
import request from 'request';

let baseUserToken;
let baseUser;
let baseUrl;

function GET(serverUrl, uri, query, option) {
  let req = {
    uri: serverUrl + uri,
    method: 'GET',
    qs: query,
  }
  if (option && option.headers) {
    req.headers = option.headers;
  }
  return new Promise(function (resolve, reject) {
    request(req, function (err, res, body) {
      if (err) {
        return reject(err);
      }
      try {
        body = JSON.parse(body);
        if (body.code !== 200) {
          return reject(body.message);
        }
        resolve(body);
      } catch (err) {
        console.log(err, res, body);
        reject(err);
      }
    });
  });
}

function POST(serverUrl, uri, body, option) {
  console.log('POST', uri);
  let req = {
    uri: serverUrl + uri,
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    }
  }
  if (option && option.headers) {
    Object.assign(req.headers, option.headers)
  }
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
        console.log(err, res, body);
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
    options.token = token;
  }
}

function checkStatusCode(result) {
  //console.log(result);
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
    //console.log('123123123',results);
    if (results[0].data.token) {
      setBaseAuthToken(results[0].data.token);
      setBaseUser(results[0].data.currentUser);
    }
    return results[0]
  })
}

function deauthenticate() {
  const baseDeauth = GET(baseUrl, '/user/deauthenticate', {});
  return Promise.all([baseDeauth])
  .then(results => {
    setBaseAuthToken(null);
    return results
  })
}

function createFile(options) {
  //here create file record on geno server
  // authorize(options);
  // return POST(baseUrl, '/file/create', options)
  return Promise.resolve({ name: 'data-uploader-test', id: 'data-uploader-test' });
}

function getOSSToken(fileId) {
  //here get oss token from geno server
  // let query = {}
  // authorize(query);
  // return GET(baseUrl, '/file/upload/osstoken/' + fileId, query)
  return Promise.resolve({
    AccessKeyId: "wzDyN0BDsEl2JmgW",
    AccessKeySecret: "CUjn2POzoVD0cqhnYDfYqutEcYupLJ",
    Bucket: "curacloud-geno-test",
    Expiration: "",
    Region: "oss-cn-qingdao",
    Security: "",
  });
}

function getGenoProjects() {
  let token = getBaseAuthToken();
  if (!token) {
    throw new Error('NO GENO TOKEN!')
  }
  return GET(baseUrl, '/projects', {},
    {
      headers: {
        'x-GENO-Auth-Token': token,
      }
    })
  .then(checkStatusCode)
  .then(result => {
    return result.projects;
  });
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
}