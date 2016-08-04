/**
 * AuthController
 */
(function () {

  angular.module('Uploader.auth').controller('AuthController', ['$scope', '$http', '$window', 'Session', 'api', 'serverUrl', authController]);
  function authController($scope, $http, $window, Session, api, serverUrl) {

    $scope.doLogin = function () {
      var data = {
        username: $scope.username,
        password: $scope.password,
      };
      api.login(data, $scope);
    };
  }

})();

/**
 * UserController
 */
(function () {

  angular.module('Uploader.views').controller('UserController', ['$scope', '$http', '$window', 'Session', 'api', 'serverUrl', userController]);
  function userController($scope, $http, $window, Session, api, serverUrl) {

    var LOCAL_TOKEN_KEY = 'token';
    var LOCAL_CURRENT_USER = 'currentUser';

    $scope.doLogout = function () {
      api.logout();
    };
  }

})();

/**
 * StatusController
 */
(function () {

  angular.module('Uploader.views')
  .controller('StatusController', ['$scope', 'api', '$interval', uploadController]);
  function uploadController($scope, api, $interval) {

  }

})();
/**
 * UploaderController
 */
(function () {

  angular.module('Uploader.views').controller('UploadController', ['$scope', 'api', '$interval', uploadController]);
  function uploadController($scope, api, $interval) {
    $scope.dcmDir = '';
    $scope.readResults = {
      studies: null,
      dcmCount: 0,
      dcmInfos: null,
      syncId: '',
    }
    $scope.procession = '';
    var intervalId = null;

    $scope.read = function () {
      api.readDcm({ dir: $scope.dcmDir })
      .then(function (result) {
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
          $scope.procession = result.success + '/' + $scope.readResults.dcmCount;
          if (result.success == $scope.readResults.dcmCount && intervalId != null) {
            $interval.cancel(intervalId);
            $scope.procession = 'upload finish';
          }
        })
    };

    $scope.browseFolder = function (path) {
      $scope.dcmDir = '/Users/intern07/Desktop/dcms/test';
    }
    
  }

})();

/**
 * AutoScanController
 */
(function () {

  'use strict';
  angular.module('Uploader.views').controller('AutoScanController', ['$scope', 'api', '$interval', autoScanController]);
  function autoScanController($scope, api, $interval) {
    var WORKING = 1, STOPPING = -1 , STOPPED = 0
    var intervalId = null;

    $scope.dcmDir = '';
    $scope.procession = '';
    $scope.syncId = '';
    $scope.state = STOPPED;
    $scope.message = '';
    $scope.startScan = function () {
      
      api.startScan({ dir: $scope.dcmDir }).then(function (result) {
        console.log(result);
        $scope.state = WORKING;
        $scope.message = '文件夹监控已打开';
        $scope.syncId = result.syncId;
        intervalId = $interval(getStatus, 500);
      });
    }
    $scope.endScan = function () {
      api.endScan({}).then(function (result) {
        //console.log(result.file);
        $scope.state = STOPPED;
        $scope.message = '文件夹监控已关闭';
      });
      $scope.state = STOPPING;
      $scope.message = '正在关闭对文件夹的监控...'
    }
    $scope.browseFolder = function (path) {
      $scope.dcmDir = '/Users/intern07/Desktop/dcms/autoscan';
    }

    var getStatus = function () {
      var syncId = $scope.syncId;
      return api.getUploadStatus(syncId).then(
        function (result) {
          $scope.procession = result.success + '/' + result.total;
          if (result.success == result.total && intervalId != null && $scope.state == STOPPED) {
            $interval.cancel(intervalId);
            $scope.procession = 'upload finish';
          }
        })
    };
  };

})();


/**
 * AutoPushController
 */
(function () {

  'use strict';
  angular.module('Uploader.views').controller('AutoPushController', ['$scope', 'api', '$interval', autoPushController]);
  function autoPushController($scope, api, $interval) {
    var WORKING = 1, STOPPING = -1 , STOPPED = 0;
    $scope.state = STOPPED;
    $scope.message = '';

    $scope.startListen = function () {
      api.startListen({}).then(function (result) {
        $scope.state = WORKING;
        $scope.message = '自动推送服务已启动';
      })
    }

    $scope.stopListen = function () {
      api.stopListen({}).then(function (result) {
        $scope.state = STOPPED;
        $scope.message = '自动推送服务已关闭';
      });
      $scope.state = STOPPING;
      $scope.message = '正在关闭自动推送服务...'
    }
  };

})();


/**
 * HistoryController
 */
(function () {

  angular.module('Uploader.views').controller('HistoryController', ['$scope', 'api', historyController]);
  function historyController($scope, api) {
    $scope.table = {
      uploadList: [],
      page: 1,
      pageSize: 10,
      total: 0,
      pageTotalNum:0,
    };
    list($scope.table.pageSize, $scope.table.page);

    $scope.next = function () {
      $scope.table.page++;
      list($scope.table.pageSize, $scope.table.page);
    };
    $scope.pre = function () {
      $scope.table.page--;
      list($scope.table.pageSize, $scope.table.page);
    };

    function list(count,page){
      api.listUpload({ page: page, count: count })
      .then(function (result) {
        $scope.table.uploadList = result.uploadList;
        $scope.table.total = result.total;
        $scope.table.pageTotalNum = _.ceil($scope.table.total/$scope.table.pageSize);
      });
    }
  };

})();

/**
 * SettingController
 */
(function () {

  angular.module('Uploader.views').controller('SettingController', ['$scope', 'api', settingController]);
  function settingController($scope, api) {

  };

})();
