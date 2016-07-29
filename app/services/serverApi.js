import { util } from '../util';
const logger = util.logger.getLogger('upload');
import Promise from 'bluebird';
import co from 'co';
import request from 'request';

let token;
let baseUrl;

function setBaseUrl(url) {
  logger.debug('setBaseUrl', url);
  baseUrl = url;
}

function GET(uri, query) {
  return new Promise(function (resolve, reject) {
    request({
      uri: baseUrl + uri,
      method: 'GET',
      qs: query,
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

function getToken(username, password) {
  return POST('/user/authenticate', {
    username,
    password,
  })
  .then(result => result.data.token)
  .then(_token => {
    token = _token
  });
}

export {
  setBaseUrl,
  getToken,
}