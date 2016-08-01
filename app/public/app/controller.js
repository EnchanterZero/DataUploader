/**
 * AuthController
 */
angular.module('Uploader').controller('AuthController', ['$scope','$http', '$window', 'Session','api','serverUrl', authController]);
function authController($scope, $http, $window, Session,api,serverUrl) {

  $scope.doLogin = function () {
    var data =  {
        username: $scope.username,
        password: $scope.password,
      };
    api.login(data,$scope);
  };
}

/**
 * UserController
 */
angular.module('Uploader').controller('UserController', ['$scope','$http', '$window', 'Session','api','serverUrl', userController]);
function userController($scope, $http, $window, Session,api,serverUrl) {

  var LOCAL_TOKEN_KEY = 'token';
  var LOCAL_CURRENT_USER = 'currentUser';

  $scope.doLogout = function () {
    api.logout();
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
    dcmInfos :null,
    syncId:'',
  }
  $scope.message = '';

  $scope.read = function () {
    var dir = $('input').val();
    console.log(dir);
    var t = dir.split('/');
    t.pop();
    $scope.dir = t.join('/');
    api.readDcm({ dir: $scope.dir })
    .then(function(result){
      /*PatientName: item.PatientName,
       PatientID: item.PatientID,
       StudyInstanceUID: item.StudyInstanceUID,
      * */
      console.log(result);
      $scope.readResults.studies = result.studies;
      $scope.readResults.dcmCount = result.dcmInfos.length;
      $scope.readResults.dcmInfos = result.dcmInfos;
      });
  };

  $scope.upload = function () {
    api.uploadFile({dcmInfos: $scope.readResults.dcmInfos}).then(function(result){
      $scope.message = result;
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
