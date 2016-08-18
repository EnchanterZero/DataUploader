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
      alert('123123123');
      api.logout();
    };
  }

})();
/**
 * UploaderController
 */
(function () {

  angular.module('Uploader.views').controller('UploadController', ['$rootScope', 'api', '$interval', uploadController]);
  function uploadController($rootScope, api, $interval) {
    //$rootScope.uploadControllerScope --> $scope
    var getFileUplodStatuses = function ($scope) {
      $scope.intervalId = $interval(function () {
        getFileList($scope);
        }, 1500);
    };
    var getFileList = function ($scope) {
      return api.getFileInfoList().then(
        function (result) {
          if(result.fileInfoList) {
            if (!$scope.oldfileInfoList) {
              utils.formatList(result.fileInfoList, result.fileInfoList);

              $scope.oldfileInfoList = result.fileInfoList;
              $scope.fileInfoList = result.fileInfoList;
            } else {
              utils.formatList(result.fileInfoList, $scope.oldfileInfoList);

              $scope.oldfileInfoList = $scope.fileInfoList;
              $scope.fileInfoList = result.fileInfoList;
            }
          }
        }
      );
    }

    if (!$rootScope.uploadControllerScope) {
      $rootScope.uploadControllerScope = {};
      var $scope = $rootScope.uploadControllerScope;
      if (!$rootScope.$settings) {
        api.getSettings()
        .then(function (result) {
          $rootScope.$settings = result.settings;
          $scope.dcmDir = $rootScope.$settings.UploadDir;
        })
      } else {
        $scope.dcmDir = $rootScope.$settings.UploadDir;
      }
      $scope.fileInfoList;
      getFileUplodStatuses($scope);

      $scope.browseAndUpload = function () {
        const { dialog } = require('electron').remote;
        var path = dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] });
        if (path) {
          $scope.dcmDir = path[0];
          var stat = require('fs').statSync(path[0]);
          if (stat.isFile()) {
            $scope.working = true;
            $scope.message = '';
            console.log(path[0]);
            $scope.message = '';
            api.uploadFile(path[0]).then(function (result) {
              //$scope.readResults.syncId = result.syncId;
              // $scope.intervalId = $interval(function () {
              //   getStatus($scope);
              // }, 1000);
            });
          } else {
            $scope.message = '文件选择错误!请重新选择';
            $scope.dcmDir = '';
          }
        }
      }
      $scope.browseFolder = function (path) {
        const { dialog } = require('electron').remote;
        $scope.dcmDir = dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] });
      };
      $scope.pauseUpload = function (sId) {
        api.stopUploadFile(sId).then(function () {
        });
      };
      $scope.resumeUpload = function (sId) {
        api.resumeUploadFile(sId).then(function () {
        });
      };


    } else if ($rootScope.uploadControllerScope.intervalId) {
      var $scope = $rootScope.uploadControllerScope;
      $scope.intervalId = $interval(function () {
        getFileUplodStatuses($scope);
      }, 1500);
      //console.log('$interval continue : ', $rootScope.autoScanControllerScope.intervalId);
    }
  }


})();

/**
 * SettingController
 */
(function () {

  angular.module('Uploader.views').controller('SettingsController', ['$scope', '$rootScope', 'SettingService', 'api', settingController]);
  function settingController($scope, $rootScope, SettingService, api) {
    console.log('setting!!!!!!');
    $scope.PACSProvider = $rootScope.$settings.PACSProvider;
    $scope.PACSServerIP = $rootScope.$settings.PACSServerIP;
    $scope.PACSServerPort = $rootScope.$settings.PACSServerPort;
    $scope.ScanInterval = $rootScope.$settings.ScanInterval;
    $scope.UserValidateURL = $rootScope.$settings.UserValidateURL;
    $scope.AnonymousMode = $rootScope.$settings.AnonymousMode;

    $scope.AnonymousModeCheck = $scope.AnonymousMode == 1 ? true : false;
    $scope.message = '';
    $scope.saveSettings = function () {

      SettingService.setSettings({
        PACSProvider: $scope.PACSProvider,
        PACSServerIP: $scope.PACSServerIP,
        PACSServerPort: $scope.PACSServerPort,
        ScanInterval: $scope.ScanInterval,
        UserValidateURL: $scope.UserValidateURL,
        AnonymousMode: $scope.AnonymousModeCheck ? 1 : 0,
      }).then(function (result) {
        $scope.message = '已保存设置';
      })
    }
  };

})();
