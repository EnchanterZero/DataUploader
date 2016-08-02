/**
 * AuthController
 */
angular.module('Uploader').controller('AuthController', ['$scope', '$http', '$window', 'Session', 'api', 'serverUrl', authController]);
function authController($scope, $http, $window, Session, api, serverUrl) {

  $scope.doLogin = function () {
    var data = {
      username: $scope.username,
      password: $scope.password,
    };
    api.login(data, $scope);
  };
}

/**
 * UserController
 */
angular.module('Uploader').controller('UserController', ['$scope', '$http', '$window', 'Session', 'api', 'serverUrl', userController]);
function userController($scope, $http, $window, Session, api, serverUrl) {

  var LOCAL_TOKEN_KEY = 'token';
  var LOCAL_CURRENT_USER = 'currentUser';

  $scope.doLogout = function () {
    api.logout();
  };
}


/**
 * UploaderController
 */
angular.module('Uploader').controller('UploadController', ['$scope', 'api', '$interval', uploaderController]);
function uploaderController($scope, api, $interval) {
  $scope.dir = '';
  $scope.readResults = {
    studies: null,
    dcmCount: null,
    dcmInfos: null,
    syncId: '',
  }
  $scope.message = '';
  var intervalId = null;

  $scope.read = function () {
    var dir = $('input').val();
    console.log(dir);
    var t = dir.split('/');
    t.pop();
    $scope.dir = t.join('/');
    api.readDcm({ dir: $scope.dir })
    .then(function (result) {
      /*PatientName: item.PatientName,
       PatientID: item.PatientID,
       StudyInstanceUID: item.StudyInstanceUID,
       * */
      $scope.readResults.studies = result.studies;
      $scope.readResults.dcmCount = result.dcmInfos.length;
      $scope.readResults.dcmInfos = result.dcmInfos;
    });
  };
  $scope.upload = function () {
    api.uploadFile({ dcmInfos: $scope.readResults.dcmInfos }).then(function (result) {
      console.log(result);
      $scope.readResults.syncId = result.syncId;
      intervalId = $interval(getStatus, 500);
    });
  }
  var getStatus = function () {
    syncId = $scope.readResults.syncId;
    return api.getUploadStatus(syncId).then(
      function (result) {
        $scope.message = result.success + '/' + $scope.readResults.dcmCount;
        if (result.success == $scope.readResults.dcmCount && intervalId != null) {
          $interval.cancel(intervalId);
          $scope.message = 'upload finish';
        }
      })
  };
}

/**
 * AutoScanController
 */
'use strict';
angular.module('Uploader').controller('AutoScanController', ['$scope', 'api', '$interval', autoScanController]);
function autoScanController($scope, api, $interval) {
  $scope.dir = '';
  $scope.message = '';
  $scope.syncId = '';

  $scope.startScan = function () {
    var dir = $('input').val();
    console.log(dir);
    var t = dir.split('/');
    t.pop();
    $scope.dir = t.join('/');
    api.startScan({}).then(function (result) {
      console.log(result);
      $scope.syncId = result.syncId;
      intervalId = $interval(getStatus, 500);
    });
  }
  $scope.endScan = function () {
    api.endScan({}).then(function (result) {
      //console.log(result.file);
    });
  }
  var getStatus = function () {
    syncId = $scope.syncId;
    return api.getUploadStatus(syncId).then(
      function (result) {
        $scope.message = result.success + '/' + result.total;
        if (result.success == result.total && intervalId != null) {
          //$interval.cancel(intervalId);
          $scope.message = 'upload finish';
        }
      })
  };
};

/**
 * HistoryController
 */
angular.module('Uploader').controller('HistoryController', ['$scope', 'api', historyController]);
function historyController($scope, api) {
  $scope.table = {
    uploadList: [],
    page: 1,
    count: 3,
    total: 0,
  };
  list($scope.table.count, $scope.table.page);

  $scope.next = function () {
    $scope.table.page++;
    list($scope.table.count, $scope.table.page);
  };
  $scope.pre = function () {
    $scope.table.page--;
    list($scope.table.count, $scope.table.page);
  };

  function list(count,page){
    api.listUpload({ page: page, count: count })
    .then(function (result) {
      $scope.table.uploadList = result.uploadList;
      $scope.table.total = result.total;
    });
  }
};

/**
 * SettingController
 */
angular.module('Uploader').controller('SettingController', ['$scope', 'api', settingController]);
function settingController($scope, api) {

};