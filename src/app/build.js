//require backend services
var _BackendService = require('../../dist/services');
var _FileInfo = require('../../dist/modules/fileinfo');
var _Config = require('../../dist/modules/config');
var co = require('co');
var Utils = function () {
  var KB = 1024;
  var MB = 1024 * KB;
  var GB = 1024 * MB;
  var getFormatDateString = function (date) {
    return date.getFullYear() + '年' + date.getMonth() + '月' + date.getDay() + '日 ' +
      date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
  };
  var getFormatSpeedString = function (speed) {
    if (speed < KB)
      return (speed).toFixed(2) + 'B/s';
    else if (speed <= MB)
      return (speed / KB).toFixed(2) + 'KB/s';
    else
      return (speed / MB).toFixed(2) + 'MB/s';
  }
  var getFormatSizeString = function (size) {
    if (size < KB)
      return (size).toFixed(2) + 'B';
    else if (size <= MB)
      return (size / KB).toFixed(2) + 'KB';
    else if (size <= GB)
      return (size / MB).toFixed(2) + 'MB';
    else
      return (size / GB).toFixed(2) + 'GB';
  }
  this.getFormatDateString = getFormatDateString;
  this.getFormatSpeedString = getFormatSpeedString;
  this.getFormatSizeString = getFormatSizeString;
  this.formatList = function (arr, oldArr) {
    arr.map(function (item) {
      var date;
      var syncId = item.syncId;
      if (item['createdAt']) {
        date = new Date(Date.parse(item['createdAt']));
        item['createdAt'] = getFormatDateString(date);
      }
      if (item['updatedAt']) {
        date = new Date(Date.parse(item['updatedAt']));
        item['updatedAt'] = getFormatDateString(date);
      }
      if(item['size']){
        item['size'] = getFormatSizeString(item['size']);
      }
      if (item['speed']) {
        //the item is a finished or a pausing item
        if (item['status'] != 'uploading') {
          //console.log("original item['speed']-->" + item['speed']);
          item['speed'] = getFormatSpeedString(item['speed'] * 1)
        }
        //the item is a uploading item
        else {
          var lastItem = _.find(oldArr, function (o) {
            return o.syncId == syncId
          });
          //no checkPoint means speed should be 0
          if(!lastItem || !lastItem['checkPoint'] || !item['checkPoint']){
            item['speed'] = getFormatSpeedString(0);
          }else {
            var cpt = JSON.parse(item['checkPoint']);
            var lastCpt = JSON.parse(lastItem['checkPoint']);
            var v = (cpt.nextPart - lastCpt.nextPart) * cpt.partSize;
            if (lastItem['checkPointTime'] != 0 && v != 0) {
              item['speed'] = getFormatSpeedString(v / ((item['checkPointTime'] - lastItem['checkPointTime']) / 1000));
            } else
              item['speed'] = getFormatSpeedString(0);
          }
        }
      }
      if (item['progress']) {
        item['progress'] = (item['progress'] * 100).toFixed(2);
      }
    });
    return arr;
  };
  return this;
}
var utils = new Utils();
/**
 * Uploader.auth
 */
(function () {
  'use strict';

  angular.module('Uploader.auth', [
    'ui.router',
    'Uploader.services',
    'Uploader.config',
  ])
})();
/**
 * Uploader.config
 */
(function () {
  'use strict';

  var app = angular.module('Uploader.config', []);

  var config_data = {
    'serverUrl': "http://" + window.location.host,
  };

  angular.forEach(config_data, function (value, key) {
    app.constant(key, value);
  });

})();

/**
 * Uploader
 */

(function () {

  var app = angular.module('Uploader', [
    'ui.router',
    'ui.bootstrap',
    'Uploader.views',
    'Uploader.services',
  ]);

  app.config(['$stateProvider', function ($stateProvider) {
    console.log('app.config');
  }])
  .run(['Session', 'AuthService', 'SettingService', '$state', '$timeout', '$interval', '$window', '$rootScope', 'api',
    function (Session, AuthService, SettingService, $state, $timeout, $interval, $window, $rootScope, api) {

      console.log('app.run');

      try{
        /**
         * get settings
         */
        SettingService.loadSettings();

        /**
         * auth check
         */
        //$window.alert('请先登录!');
        $timeout(function () {
          AuthService.gotoLogin();
        }, 0);

      }catch (err){
        console.log(err,err.stack);
      }

      /**
       * page change check
       */
      $rootScope.$on('$stateChangeStart',
        function (event, toState, toParams, fromState, fromParams) {
          if ($rootScope.uploadControllerScope && $rootScope.uploadControllerScope.intervalId) {
            console.log('$interval pause : ',$rootScope.uploadControllerScope.intervalId);
            $interval.cancel($rootScope.uploadControllerScope.intervalId);
          }
        }
      );
    }]);

})();
/**
 * Uploader.services
 */
(function () {
  angular.module('Uploader.services', [
    'Uploader.config',
  ])
})();
/**
 * Uploader.views
 */
(function () {
  var app = angular.module('Uploader.views', [
    'ui.router',
    'ui.bootstrap'
  ])
  .config(['$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {

      // For any unmatched url, send to /status
      $urlRouterProvider.otherwise("/login");

      $stateProvider
      // .state('status', {
      //   url: "/status",
      //   templateUrl: 'views/dashboard/status.html',
      // })
      .state('upload', {
        url: "/upload",
        templateUrl: './views/dashboard/upload.html',
      })
      .state('login', {
        url: "/login",
        templateUrl: './views/dashboard/auth.html',
      })
      // .state('autoscan', {
      //   url: "/autoscan",
      //   templateUrl: 'views/dashboard/autoscan.html',
      // })
      // .state('autopush', {
      //   url: "/autopush",
      //   templateUrl: 'views/dashboard/autopush.html',
      // })
      // .state('history', {
      //   url: "/history",
      //   templateUrl: 'views/dashboard/history.html',
      // })
      .state('settings', {
        url: "/settings",
        templateUrl: './views/dashboard/settings.html',
      })
    }]);
})();
/**
 * service api
 */
(function () {
  var logger = require('../../dist/util').util.logger.getLogger('serviceApi');

  angular.module('Uploader.services')
  .service('api', ['$http', '$rootScope', 'serverUrl', 'Session', '$window', function ($http, $rootScope, serverUrl, Session, $window) {
    var LOCAL_BASE_TOKEN_KEY = 'baseToken';
    var LOCAL_CURRENT_USER = 'currentUser';
    var api = this;

    /**
     * auth api
     */
    this.login = function (query, $scope) {
      return _BackendService.serverApi.authenticate(query.username, query.password)
      .then(function (result) {
        Session.set(LOCAL_BASE_TOKEN_KEY, result.data.token);
        Session.set(LOCAL_CURRENT_USER, result.data.currentUser);
        console.log('login success!!!!!!');
        $window.location.hash = '#/upload';
      })
      .catch(function (err) {
        console.log(err);
        $scope.errorMessage = err.message;
      });
    };

    this.logout = function () {
      return _BackendService.serverApi.deauthenticate()
      .then(() => {
        Session.set(LOCAL_BASE_TOKEN_KEY, null);
        Session.set(LOCAL_CURRENT_USER, null);
        console.log('logout success!!!!!!');
        $window.location.hash = '#/login';
      });
    }
    this.setUserToken = function () {
      var token = Session.get(LOCAL_BASE_TOKEN_KEY);
      return co(function*() {
        if (token) {
          _BackendService.serverApi.setBaseAuthToken(token);
        }
        return {}
      })
    }

    /**
     * manual upload api
     */
    this.getFileInfoList = function () {
      return _FileInfo.listFiles()
      .then(function (r) {
        return { fileInfoList: r }
      })
    }

    this.uploadFile = function (data) {
      var project = data.project;
      var path = data.fileList[0];
      var syncId = new Date().getTime().toString();
      co(function*() {
        let r = yield _BackendService.fileUpload.uploadFiles(project, data.fileList, syncId, { afterDelete: false });
      }).catch((err) => {
        console.error(err, err.stack);
      });
      return co(function*() {
        return { syncId: syncId }
      });

    }

    this.stopUploadFile = function (syncId) {
      return _BackendService.fileUpload.stopUploadFiles(syncId)
      .then((r)=> {
        return { result: r }
      });
    }

    this.resumeUploadFile = function (syncId) {
      co(function*() {
        let r = yield _BackendService.fileUpload.uploadFiles(null, [], syncId, { afterDelete: false });
      })
      .catch((err) => {
        logger.error(err, err.stack);
      });
      return co(function*() {
        return {}
      })
    }

    this.abortUploadFile = function (syncId) {
      co(function*() {
        yield _BackendService.fileUpload.abortUploadFiles(syncId);
      })
      .catch((err) => {
        logger.error(err, err.stack);
      });
      return co(function*() {
        return {}
      })
    }
    
    this.getProjects = function () {
      return _BackendService.serverApi.getGenoProjects()
    }

    /**
     * settings api
     */

    this.setSettings = function (data) {
      var settings = data.settings;
      var settingsJSON = {
        PACSProvider: settings.PACSProvider,
        PACSServerIP: settings.PACSServerIP,
        PACSServerPort: settings.PACSServerPort,
        ScanInterval: settings.ScanInterval,
        UserValidateURL: settings.UserValidateURL,
        AnonymousMode: settings.AnonymousMode,
      };
      return co(function*() {
        yield _Config.setConfig(settingsJSON);
        _BackendService.uploadSetting.setConfig(settingsJSON);
        return settingsJSON
      }).catch(err => {
        logger.error(err, err.stack);
      });
    }

    this.getSettings = function () {
      return _Config.getConfig()
      .then(function (r) {
        return { settings: r }
      })
    }

  }]);

})();

/**
 * service AuthService
 */
(function () {

  angular.module('Uploader.services')
  .service('AuthService', ['$rootScope', '$state', '$window', 'api', 'Session', authService]);

  function authService($rootScope, $state, $window, api, Session) {
    var LOCAL_BASE_TOKEN_KEY = 'baseToken';
    var LOCAL_CURRENT_USER = 'currentUser';

    var authService = this;

    $rootScope.$on('invalidTokenEvent', function () {
      authService.gotoLogin();
    });

    this.gotoLogin = function () {
      this.useCredentials(null, null);
      var currentState = $state.current.name;
      $window.location.hash = '#/login';
    }

    this.loadCredentials = function () {
      var token = Session.get(LOCAL_BASE_TOKEN_KEY);
      var currentUser = Session.get(LOCAL_CURRENT_USER);
      this.useCredentials(token, currentUser);
      return  token;
    }

    this.useCredentials = function (baseToken, currentUser) {
      this.baseToken = baseToken;
      this.currentUser = currentUser;
      $rootScope.$isAuthenticated = !!(baseToken && baseToken);
      //api.setAuthToken(token);
    }

    this.isAuthenticated = function () {
      return !!(this.baseToken);
    };

    this.getCurrentUser = function () {
      return this.currentUser;
    }

    this.logout = function () {
      this.gotoLogin();
    }

    return authService;
  }
})();
/**
 * service Session
 */
(function () {

  angular.module('Uploader.services')
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

})();
/**
 * service SettingService
 */
(function () {

  angular.module('Uploader.services')
  .service('SettingService', ['$rootScope', '$state', '$window', 'api', 'Session', settingService]);

  function settingService($rootScope, $state, $window, api, Session) {

    var LOCAL_PACSProvider = 'PACSProvider';
    var LOCAL_PACSServerIP = 'PACSServerIP';
    var LOCAL_PACSServerPort = 'PACSServerPort';
    var LOCAL_ScanInterval = 'ScanInterval';
    var LOCAL_UserValidateURL = 'UserValidateURL';
    var LOCAL_AnonymousMode = 'AnonymousMode';

    var settingService = this;

    this.loadSettings = function () {
      api.getSettings()
      .then(function (result) {
        $rootScope.$settings = result.settings;
      })
    }

    this.setSettings = function (settings) {
      var settingsJSON = {
        PACSProvider: settings.PACSProvider,
        PACSServerIP: settings.PACSServerIP,
        PACSServerPort: settings.PACSServerPort,
        ScanInterval: settings.ScanInterval,
        UserValidateURL: settings.UserValidateURL,
        AnonymousMode: settings.AnonymousMode,
      };
      return api.setSettings({ settings: settingsJSON })
      .then(function (result) {
        $rootScope.$settings = settingsJSON;
        return result;
      })
    }

    return settingService;
  }
})();
/**
 * AuthController
 */
(function () {

  angular.module('Uploader.views').controller('AuthController', ['$scope', '$http', '$window', 'Session', 'api', 'serverUrl', authController]);
  function authController($scope, $http, $window, Session, api, serverUrl) {

    $scope.errorMessage = '';
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
/**
 * UploaderController
 */
(function () {

  angular.module('Uploader.views').controller('UploadController', ['$rootScope', 'api', '$interval', '$uibModal', uploadController]);
  function uploadController($rootScope, api, $interval, $uibModal) {
    console.log('$rootScope.uploadControllerScope --> $scope');
    var getFileUplodStatuses = function ($scope) {
      $scope.intervalId = $interval(function () {
        getFileList($scope);
      }, 1500);
    };
    var getFileList = function ($scope) {
      return api.getFileInfoList().then(
        function (result) {
          if (result.fileInfoList) {
            if (!$scope.oldfileInfoList) {
              utils.formatList(result.fileInfoList, result.fileInfoList);

              $scope.oldfileInfoList = result.fileInfoList;
              $scope.fileInfoList = result.fileInfoList;
            } else {
              utils.formatList(result.fileInfoList, $scope.oldfileInfoList);

              $scope.oldfileInfoList = $scope.fileInfoList;
              $scope.fileInfoList = result.fileInfoList;
            }
            //console.log('one data load');
          }
        }
      );
    }

    if (!$rootScope.uploadControllerScope) {
      //check for recover only once
      co(function*() {
        let r = yield _FileInfo.listUploadingFiles();
        if(r){
          alert('recovering the updating...');
          _BackendService.uploadRecovery.recover(r);
        }
      });
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
      $scope.chosenFileList = [];
      getFileUplodStatuses($scope);

      $scope.browseAndUpload = function () {
        const { dialog } = require('electron').remote;
        var path = dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections',] });
        if (path) {
          $scope.dcmDir = path[0];
          var stat = require('fs').statSync(path[0]);
          if (stat.isFile()) {
            $scope.chosenFileList = [];
            $scope.chosenFileList.push({
              filePath: path[0],
              size: stat.size
            });
            $scope.message = '';
            openUploadModal();

          } else {
            $scope.message = '文件选择错误!请重新选择';
            $scope.dcmDir = '';
          }
        }
      }
      var openUploadModal = function (size) {
        var modalInstance = $uibModal.open({
          animation: true,
          templateUrl: './views/dashboard/uploadmodal.html',
          controller: 'UploadModalController',
          size: size,
          resolve: {
            fileList: function () {
              return $scope.chosenFileList;
            }
          }
        });

        modalInstance.result.then(function (selectedProject) {
          return api.uploadFile({
            project: selectedProject,
            fileList: $scope.chosenFileList,
          })
        }, function () {
          console.log('Modal dismissed at: ' + new Date());
        });
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
      $scope.abortUpload = function (sId) {
        api.abortUploadFile(sId).then(function () {
        });
      };

    } else if ($rootScope.uploadControllerScope.intervalId) {
      var $scope = $rootScope.uploadControllerScope;
      getFileUplodStatuses($scope);
      console.log('$interval continue : ', $rootScope.uploadControllerScope.intervalId);
    }
  }

  /**
   *
   */

  angular.module('Uploader.views').controller('UploadModalController', ['$scope', 'api', '$uibModalInstance', 'fileList', uploadModalController]);
  function uploadModalController($scope, api, $uibModalInstance, fileList) {
    var totalSize = _.reduce(fileList, function (sum, f) {
      return sum + f.size;
    }, 0);
    $scope.totalSize = utils.getFormatSizeString(totalSize);
    $scope.fileList = fileList;
    api.getProjects().then(function (list) {
      $scope.projectList = list;
      $scope.selectedProject = $scope.projectList[0];
    })

    $scope.ok = function () {
      $uibModalInstance.close($scope.selectedProject);
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  }
})();
/**
 * UserController
 */
(function () {

  angular.module('Uploader.views').controller('UserController', ['$scope', '$http', '$window', 'Session', 'api', 'serverUrl', userController]);
  function userController($scope, $http, $window, Session, api, serverUrl) {

    $scope.doLogout = function () {
      //alert('123123123');
      api.logout();
    };
  }

})();