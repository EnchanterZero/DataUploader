import { util } from '../util';
const logger = util.logger.getLogger('upload');
import Promise from 'bluebird';
import request from 'request';

let userToken;
let baseUrl;

function GET(uri, query) {
  return new Promise(function (resolve, reject) {
    request({
      uri: baseUrl + uri,
      method: 'GET',
      qs: query,
    }, function (err, res, body) {
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

function POST(uri, body) {
  console.log('POST', uri);
  return new Promise(function (resolve, reject) {
    request({
      uri: baseUrl + uri,
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    }, function (err, res, body) {
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

function setBaseUrl(url) {
  logger.debug('setBaseUrl', url);
  baseUrl = url;
}

function setAuthToken(token) {
  logger.debug('setUserToken', token);
  userToken = token;
}

function getAuthToken() {
  return userToken;
}

function authorize(options) {
  var token = getAuthToken();
  if (!token) {
    throw new Error('NO TOKEN!');
  } else {
    options.token = token;
  }
}

// function checkStatusCode(result) {
//   //console.log(result);
//   if (!result) {
//     throw new Error('empty response');
//   }
//   if (result.code === 1001) {
//     $rootScope.$emit('invalidTokenEvent');
//     userToken = null;
//   }
//   if (result.code !== 200) {
//     throw new Error('code ' + result.data.code);
//   }
//   return result.data;
// }

function authenticate(username, password) {
  return POST('/user/authenticate', {
    username,
    password,
  })
  .then(result => {
    if (result.data.token)
      setAuthToken(result.data.token);
    return result;
  });
}

function deauthenticate() {
  return GET('/user/deauthenticate', {})
  .then(result => {
    userToken = null;
    return result;
  });
}

function createFile(options) {
  authorize(options);
  return POST('/file/create', options)
}

function getOSSToken(fileId) {
  let query = {}
  authorize(query);
  return GET('/file/upload/osstoken/' + fileId, query)
}

export {
  getAuthToken,
  setAuthToken,
  setBaseUrl,
  authenticate,
  deauthenticate,
  createFile,
  getOSSToken,
}