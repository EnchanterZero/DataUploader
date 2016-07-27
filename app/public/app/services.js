/**
 * Created by intern07 on 16/7/25.
 */
angular.module('Uploader')
/**
 * service Session
 */
.service('Session', [function () {
  var SESSION_STORE_NAME = 'session_store';

  var session = this;

  function load() {
    try {
      session.store = JSON.parse(window.localStorage.getItem(SESSION_STORE_NAME));
    } catch (e) {
    }
    if (!session.store) {
      session.store = {};
    }
  }
  load();

  this.save = function () {
    window.localStorage.setItem(SESSION_STORE_NAME, JSON.stringify(this.store));
  }

  this.set = function (key, val) {
    this.store[key] = val;
    this.save();
  };

  this.get = function (key, val) {
    return this.store[key];
  };
}])
/**
 * service api
 */
.service('api', ['$http', '$rootScope','serverUrl','Session', function ($http, $rootScope,serverUrl,Session) {
  var LOCAL_TOKEN_KEY = 'token';
  var LOCAL_CURRENT_USER = 'currentUser';
  var api = this;

  function authorize(options) {
    var token = Session.get(LOCAL_TOKEN_KEY);
    var credential = { token: token };
    if (options.method === 'GET') {
      options.params = _.assign(options.params, credential);
    } else {
      options.data = _.assign(options.data, credential);
    }
  }
  this.setAuthToken = function (token) {
    this.token = token;
  }
  function checkStatusCode(result) {
    if (!result || !result.data) {
      throw new Error('empty response');
    }
    if (result.data.code === 1001) {
      $rootScope.$emit('invalidTokenEvent');
      api.token = null;
    }
    if (result.data.code !== 200) {
      throw new Error('code ' + result.data.code);
    }
    return result.data.data;
  }

  this.readDcm = function (query) {
    var options = {
      method: 'POST',
      url: '/upload/read',
      data: query,
    }
    authorize(options)
    return $http(options)
    .then(checkStatusCode);
  }

  this.uploadFile = function (query,syncId) {
    var option1 = {
      method: 'POST',
      url:  serverUrl + '/file/create',
      data: query,
    }
    authorize(option1)
    return $http(option1)
    .then(checkStatusCode)
    .then(function (result) {
      var option2 = {
        method: 'GET',
        url:  serverUrl + '/file/upload/osstoken/'+result.file.id,
        data: query,
      }
      authorize(option2);
      return $http(option2)
    })
    .then(checkStatusCode)
    .then(function (result) {
      result.syncId = syncId;
      var option3 = {
        method: 'POST',
        url: '/upload/start',
        data: result,
      }
      authorize(option3);
      return $http(option3)
    })
    .then(checkStatusCode)
    .then(function (result) {
      console.log(result);
    })
  }
  
  this.startScan = function (query) {
    var option1 = {
      method: 'POST',
      url:   '/autoScan/start',
      data: query,
    }
    authorize(option1)
    return $http(option1)
    .then(checkStatusCode)
  }

  this.endScan = function (query) {
    var option1 = {
      method: 'POST',
      url:   '/autoScan/end',
      data: query,
    }
    authorize(option1)
    return $http(option1)
    .then(checkStatusCode)
  }
}]);