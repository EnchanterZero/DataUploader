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
// (function () {
//
//   angular.module('Uploader.views')
//   .controller('StatusController', ['$rootScope', 'api', '$interval', statusController]);
//   function statusController($rootScope, api, $interval) {
//     //$rootScope.statusControllerScope --> $scope
//     var getAllStatus = function ($scope) {
//       return api.getAllUploadStatus().then(
//         function (result) {
//           $scope.uploadingList = result.uploadingList;
//         });
//     }
//     if (!$rootScope.statusControllerScope) {
//       $rootScope.statusControllerScope = {};
//       var $scope = $rootScope.statusControllerScope;
//       $scope.uploadingList = [];
//       $scope.intervalId = $interval(function () {
//         getAllStatus($scope);
//       }, 500);
//     } else if ($rootScope.statusControllerScope.intervalId) {
//       var $scope = $rootScope.statusControllerScope;
//       $scope.intervalId = $interval(function () {
//         getAllStatus($scope);
//       }, 500);
//       //console.log('$interval continue : ', $rootScope.autoScanControllerScope.intervalId);
//     }
//   }
//
// })();
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
          utils.formatList(result.fileInfoList);
          $scope.fileInfoList = result.fileInfoList;
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
            $scope.message = '正在上传...';
            api.uploadFile({ dir: path[0] }).then(function (result) {
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
      /**
       * status recovery
       */
      if ($rootScope.$initStatus && $rootScope.$initStatus.ManualUpload) {
        $scope.working = true;
        $scope.readResults.syncId = $rootScope.$initStatus.ManualUpload;
        $scope.intervalId = $interval(function () {
          getStatus($scope);
        }, 500);
      }


    } else if ($rootScope.uploadControllerScope.intervalId) {
      var $scope = $rootScope.uploadControllerScope;
      $scope.intervalId = $interval(function () {
        getStatus($scope);
      }, 500);
      //console.log('$interval continue : ', $rootScope.autoScanControllerScope.intervalId);
    }
  }


})();

// /**
//  * AutoScanController
//  */
// (function () {
//
//   'use strict';
//   angular.module('Uploader.views').controller('AutoScanController', ['$scope', 'api', '$interval', '$rootScope', autoScanController]);
//   function autoScanController($scope, api, $interval, $rootScope) {
//     //$rootScope.autoScanControllerScope --> $scope
//     var WORKING = 1, STOPPING = -1, STOPPED = 0;
//     var getStatus = function ($scope) {
//       var syncId = $scope.syncId;
//       return api.getUploadStatus(syncId).then(
//         function (result) {
//           $scope.procession = result.success + '/' + result.total;
//           if (result.success == result.total && $scope.intervalId != null && $scope.state == STOPPED) {
//             $interval.cancel($scope.intervalId);
//             //console.log('$interval stop : ', $scope.intervalId);
//             $scope.intervalId = null;
//             $scope.procession = 'upload finish';
//           }
//         })
//     };
//     if (!$rootScope.autoScanControllerScope) {
//       $rootScope.autoScanControllerScope = {};
//       var $scope = $rootScope.autoScanControllerScope;
//       $scope.intervalId = null;
//
//       $scope.dcmDir = $rootScope.$settings.ScanDir;
//       $scope.procession = '';
//       $scope.syncId = '';
//       $scope.state = STOPPED;
//       $scope.message = '';
//       $scope.startScan = function () {
//
//         api.startScan({ dir: $scope.dcmDir }).then(function (result) {
//           console.log(result);
//           $scope.state = WORKING;
//           $scope.message = '文件夹监控已打开';
//           $scope.syncId = result.syncId;
//           $scope.intervalId = $interval(function () {
//             getStatus($scope);
//           }, 500);
//         });
//       }
//       $scope.endScan = function () {
//         api.endScan({}).then(function (result) {
//           //console.log(result.file);
//           $scope.state = STOPPED;
//           $scope.message = '文件夹监控已关闭';
//         });
//         $scope.state = STOPPING;
//         $scope.message = '正在关闭对文件夹的监控...'
//       }
//       $scope.browseFolder = function (path) {
//         const { dialog } = require('electron').remote;
//         var path = dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] });
//         if (path) {
//           $scope.dcmDir = path[0];
//           $scope.message = '';
//           var stat = require('fs').statSync($scope.dcmDir);
//           if (!stat.isDirectory()) {
//             $scope.message = '文件夹选择错误!请重新选择';
//             $scope.dcmDir = '';
//           }
//         }
//       }
//       /**
//        * status recovery
//        */
//       if ($rootScope.$initStatus.AutoScanUpload) {
//         $scope.message = '文件夹监控已打开';
//         $scope.state = WORKING;
//         $scope.syncId = $rootScope.$initStatus.AutoScanUpload;
//         $scope.intervalId = $interval(function () {
//           getStatus($scope);
//         }, 500);
//       }
//
//     }
//     else if ($rootScope.autoScanControllerScope.intervalId) {
//       var $scope = $rootScope.autoScanControllerScope;
//       $scope.intervalId = $interval(function () {
//         getStatus($scope);
//       }, 500);
//       //console.log('$interval continue : ', $rootScope.autoScanControllerScope.intervalId);
//     }
//   }
//
// })();


/**
 * AutoPushController
 */
// (function () {
//
//   'use strict';
//   angular.module('Uploader.views').controller('AutoPushController', ['$scope', 'api', '$rootScope', '$interval', autoPushController]);
//   function autoPushController($scope, api, $rootScope, $interval) {
//     //$rootScope.autoPushControllerScope --> $scope
//     var WORKING = 1, STOPPING = -1, STOPPED = 0;
//     if (!$rootScope.autoPushControllerScope) {
//       $rootScope.autoPushControllerScope = {};
//       var $scope = $rootScope.autoPushControllerScope;
//
//       $scope.state = STOPPED;
//       $scope.message = '';
//
//       $scope.startListen = function () {
//         api.startListen({}).then(function (result) {
//           $scope.state = WORKING;
//           $scope.message = '自动推送服务已启动';
//         })
//       }
//
//       $scope.stopListen = function () {
//         api.stopListen({}).then(function (result) {
//           $scope.state = STOPPED;
//           $scope.message = '自动推送服务已关闭';
//         });
//         $scope.state = STOPPING;
//         $scope.message = '正在关闭自动推送服务...'
//       }
//
//       /**
//        * status recovery
//        */
//       if ($rootScope.$initStatus.AutoPushUpload) {
//         $scope.state = WORKING;
//         $scope.message = '自动推送服务已启动';
//       }
//     }
//   }
//
// })();


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
      pageTotalNum: 0,
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

    function list(count, page) {
      api.listUpload({ page: page, count: count })
      .then(function (result) {
        utils.formatList(result.uploadList)
        $scope.table.uploadList = result.uploadList;
        $scope.table.total = result.total;
        $scope.table.pageTotalNum = _.ceil($scope.table.total / $scope.table.pageSize);
      });
    }
  };

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
