/**
 * AuthController
 */
angular.module('Uploader').controller('AuthController', ['$scope','$http', '$window', 'Session','api','serverUrl', authController]);
function authController($scope, $http, $window, Session,api,serverUrl) {

  var LOCAL_TOKEN_KEY = 'token';
  var LOCAL_CURRENT_USER = 'currentUser';

  $scope.doLogin = function () {
    return $http({
      method: 'POST',
      url:  serverUrl + '/user/authenticate',
      data: {
        username: $scope.username,
        password: $scope.password,
      }
    })
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
}


/**
 * UploaderController
 */
angular.module('Uploader').controller('UploadController', ['$scope', 'api', uploaderController]);
function uploaderController($scope, api) {
  $scope.dir = '';
  $scope.readResults = {
    studies:null,
    dcmCount: null,
    syncId:''
  }
  $scope.read = function () {
    var dir = $('input').val();
    console.log(dir);
    var t = dir.split('/');
    t.pop();
    $scope.dir = t.join('/');
    api.readDcm({ dir: $scope.dir })
    .then(function(result){
      $scope.readResults.studies = result.studies;
      $scope.readResults.dcmCount = result.dcmCount;
      $scope.readResults.syncId = result.syncId;
      });
  };
  $scope.upload = function () {
    api.uploadFile({
      type: 'dcm',
      size: '15213',
      hash: '9A8S6789A7WG69WDHNFA98HFAABOV9E8SHAVOA',
      name: 'HAHAHAHAHAH',
      isZip: false
    },$scope.readResults.syncId).then(function(result){
      //console.log(result.file);
    });
  }
}

/**
 * AutoScanController
 */
'use strict';
angular.module('Uploader').controller('AutoScanController', ['$scope','api', autoScanController]);
function autoScanController($scope,api) {
  $scope.dir = '';
  $scope.startScan = function () {
    var dir = $('input').val();
    console.log(dir);
    var t = dir.split('/');
    t.pop();
    $scope.dir = t.join('/');
    api.startScan({
    }).then(function (result) {
      //console.log(result.file);
    });
  }
  $scope.endScan = function () {
    api.endScan({
    }).then(function (result) {
      //console.log(result.file);
    });
  }
};

/**
 * SettingController
 */
angular.module('Uploader').controller('SettingController', ['$scope','api', settingController]);
function settingController($scope,api) {

};
