import { util } from '../util';
const logger = util.logger.getLogger('upload');
import Promise from 'bluebird';
import co from 'co';
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
  userToken = token;
}

function getAuthToken() {
  //return userToken;
  let t = {"token":"Z1Lll7CdlvxJOMFYMU2NAE1J8SDTlLeS","currentUser":{"id":"21ca765a-e186-4be6-ad2b-3189e675d857","username":"test","realname":"test","cellphone":null,"email":"test@curacloudplatform.com","expires":null,"deleted":false,"createdAt":"2016-08-01T07:56:17.000Z","updatedAt":"2016-08-01T07:56:17.000Z","roles":["doctor","7bb4eec1-623d-4424-b1e3-860e99e461ce:owner","b2665e01-dbb1-4daa-8d5a-1e59f09f923f:owner","7c325c55-09d6-4328-bedd-b5b4fe38cf35:owner","2d01628d-fcda-4cf9-9640-f620f76b833a:owner","ce718863-9d08-44d5-bcf7-39710569e1db:owner","5cbe9ea7-e378-4eb9-9fca-44ae2ddfe4c3:owner","712ae045-4815-4ec6-a093-b14b569329b3:owner","9a150d50-ce2f-429a-b296-593d35cad9ff:owner","0a9dea43-57ed-4deb-a99c-9d53d848e618:owner","f01833a0-4fdc-476a-94c2-a945f1d2e632:owner","b73fc3d5-4184-4168-8561-a29be55bd05c:owner","f85af0cf-db68-4ddf-946e-43344580ea8b:owner","45c19731-7fdf-49c2-bf8e-1c3b57ef5b17:owner","bf14d6e1-a61e-4078-989c-1c6c77a75b81:owner","03045411-909d-4529-967c-8521f3c1847c:owner","3c42f672-314a-49bd-954d-a918ed96015d:owner","49951e0c-f164-4cb7-a20a-7b7ad1e65a09:owner","8f698e0f-05af-4cbe-b70b-0ffb960dff44:owner","70377789-1a66-4976-aa83-e47d1e32fa6d:owner","0ec436b2-8570-401b-b154-5ab486a6fc60:owner","61dab66e-c579-4f49-bf09-3bc46b2620b3:owner","38608273-576e-4e57-8c1f-b2554a33f5cd:owner","248cdf44-e6ce-4b11-9e50-efea94a23d9e:owner","476eeae7-347e-49f9-b590-4970d2eac9d9:owner","26ed50be-68a3-4511-96f2-cbe42f12a463:owner","08eff6f6-9a4f-445b-8d72-6ee6e9a7749a:owner"]}}
  return t.token;
}

function authorize(options) {
  var token = getAuthToken();
  if(!token){
    throw new Error('NO TOKEN!');
  }else{
    options.token = token;
  }
}

function checkStatusCode(result) {
  //console.log(result);
  if (!result) {
    throw new Error('empty response');
  }
  if (result.code === 1001) {
    $rootScope.$emit('invalidTokenEvent');
    userToken = null;
  }
  if (result.code !== 200) {
    throw new Error('code ' + result.data.code);
  }
  return result.data;
}

function authenticate(username, password) {
  return POST('/user/authenticate', {
    username,
    password,
  })
  .then(result => {
    if(result.data.token)
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

function createFile(options){
  authorize(options);
  return POST('/file/create',options)
}

function getOSSToken(fileId) {
  let query = {}
  authorize(query);
  return GET('/file/upload/osstoken/'+ fileId,query)
}

export {
  setBaseUrl,
  authenticate,
  deauthenticate,
  createFile,
  getOSSToken,
}