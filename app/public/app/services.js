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
.service('api', ['$http', '$rootScope','serverUrl','Session','$window', function ($http, $rootScope,serverUrl,Session,$window) {
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
    //log all response data
    console.log(result.data.data);
    return result.data.data;
  }
  
  this.login = function (query,$scope) {
    var options = {
      method: 'POST',
      url: '/auth/login',
      data: query,
    };
    return $http(options)
    .then(function (result) {
      if (result.data.code !== 200) {
        throw new Error(result.data.message);
        return;
      }
      if (!result.data.data.token || !result.data.data.currentUser) {
        throw new Error('empty response');
        return;
      }
      Session.set(LOCAL_TOKEN_KEY, result.data.data.token);
      Session.set(LOCAL_CURRENT_USER, result.data.data.currentUser);
      api.setAuthToken(result.data.data.token);
      console.log('login success!!!!!!');
      $window.location.href = '/index';
    })
    .catch(function (err) {
      $scope.errorMessage = err.message;
    });
  };

  this.logout = function(){
    var options = {
      method: 'POST',
      url: '/auth/logout',
    }
    authorize(options)
    return $http(options)
    .then(checkStatusCode)
    .then(() =>{
      api.token = null;
      $window.location.href = '/auth';
    });
  }

  this.readDcm = function (query) {
    var options = {
      method: 'POST',
      url: '/manualUpload/read',
      data: query,
    }
    authorize(options)
    return $http(options)
    .then(checkStatusCode);
  }

  this.uploadFile = function (query) {
      var option = {
        method: 'POST',
        url: '/manualUpload/start',
        data: query,
      }
      authorize(option);
      return $http(option)
    .then(checkStatusCode)
    .then(function (result) {
      return result;
    })
  }
  
  this.testCreateFile = function () {
    var option = {
      method: 'POST',
      url: 'http://localhost:3000' + '/file/create',
      data: {
        type: 'uploadDcm',
        size: '0',
        hash: 'NONE',
        name: 'test!!!!!!!!!!!!!!!',
        isZip: false
      },
    }
    authorize(option);
    console.log(option);
    return $http(option)
    .then(checkStatusCode)
    .then(function (result) {
      console.log(result);
    })
  }
  
  this.startScan = function (query) {
    var option1 = {
      method: 'POST',
      url:   '/autoscanUpload/start',
      data: query,
    }
    authorize(option1)
    return $http(option1)
    .then(checkStatusCode)
  }

  this.endScan = function (query) {
    var option = {
      method: 'POST',
      url:   '/autoscanUpload/stop',
      data: query,
    }
    authorize(option)
    return $http(option)
    .then(checkStatusCode)
  }
  
  this.getUploadStatus = function (query) {
    var option = {
      method: 'GET',
      url:   '/uploadStatus/' + query,
      data: query,
    }
    authorize(option);
    return $http(option)
    .then(checkStatusCode)
  }
  this.listUpload = function (query) {
    var option = {
      method: 'GET',
      url:   '/history/list/' + query.count + '/' +query.page,
      data: query,
    };
    authorize(option);
    return $http(option)
    .then(checkStatusCode)
  }
}]);