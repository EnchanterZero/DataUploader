//require backend services
process.on('uncaughtException', function(error) {
  console.error(error);
});
var _BackendService = require('../../dist/services');
var _FileInfo = require('../../dist/modules/fileinfo');
var _Config = require('../../dist/modules/config');
var _util = require('../../dist/util');
var logger = _util.util.logger.getLogger('frontEnd');
logger.debug('123123');
var co = require('co');
var Utils = function () {
  var KB = 1024;
  var MB = 1024 * KB;
  var GB = 1024 * MB;
  var getFormatDateString = function (date) {
    var y = date.getFullYear();
    var mo = _.padStart(date.getMonth() + 1, 2, '0');
    var d = _.padStart(date.getDate() + 1, 2, '0');
    var h = _.padStart(date.getHours(), 2, '0');
    var mi = _.padStart(date.getMinutes(), 2, '0');
    var s = _.padStart(date.getSeconds(), 2, '0');
    return y + '/' + mo + '/' + d + ' ' + h + ':' + mi + ':' + s;
  };
  var getFormatSpeedString = function (speed) {
    speed = speed * 1;
    if (speed < KB)
      return (speed).toFixed(2) + 'B/s';
    else if (speed <= MB)
      return (speed / KB).toFixed(2) + 'KB/s';
    else
      return (speed / MB).toFixed(2) + 'MB/s';
  }
  var getFormatSizeString = function (size) {
    size = size * 1;
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
      if (typeof item['createdAt'] != 'undefined') {
        date = new Date(Date.parse(item['createdAt']));
        item['createdAt'] = getFormatDateString(date);
      }
      if (typeof item['updatedAt'] != 'undefined') {
        date = new Date(Date.parse(item['updatedAt']));
        item['updatedAt'] = getFormatDateString(date);
      }
      if (typeof item['size'] != 'undefined') {
        item['size'] = getFormatSizeString(item['size']);
      }
      if (typeof item['speed'] != 'undefined') {
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
          if (!lastItem || !lastItem['checkPoint'] || !item['checkPoint']) {
            item['speed'] = getFormatSpeedString(0);
          } else {
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
      if (typeof item['progress'] != 'undefined') {
        item['progress'] = (item['progress'] * 100).toFixed(2);
      }
    });
    //handle working
    if (oldArr) {
      oldArr.map(function (item) {
        if (item['working'] === true) {
          var newItem = _.find(arr, function (o) {
            return o.syncId == item.syncId
          });
          if (newItem) {
            if (newItem.status == 'pausing' || (newItem.status == item.status)) {
              if (newItem.status == 'failed' && newItem['workingStatus'] == 'resuming...') {
                newItem.failedCount = item.failedCount + 1;
              }
              if (newItem.failedCount < 5) {
                newItem['working'] = true;
                newItem['workingStatus'] = item['workingStatus'];
              }else {
                newItem['working'] = false;
              }
            } else {
              newItem['working'] = false;
            }

          }
        }
      });
    }
    return arr;
  };
  this.minAssignList = function (changingArr, newArr) {

    //cut down changingArr length
    while (changingArr.length > newArr.length) {
      changingArr.pop();
    }
    //now assign new values one by one till not match
    for (var it in newArr) {
      if (changingArr[it]) {
        if (changingArr[it].id == newArr[it].id) {
          //assign necessary values
          if (changingArr[it].progress != newArr[it].progress)
            changingArr[it].progress = newArr[it].progress;

          if (changingArr[it].speed != newArr[it].speed)
            changingArr[it].speed = newArr[it].speed;

          if (changingArr[it].status != newArr[it].status)
            changingArr[it].status = newArr[it].status;

          if (changingArr[it].checkPointTime != newArr[it].checkPointTime)
            changingArr[it].checkPointTime = newArr[it].checkPointTime;

          if (changingArr[it].checkPoint != newArr[it].checkPoint)
            changingArr[it].checkPoint = newArr[it].checkPoint;

          if (changingArr[it].updatedAt != newArr[it].updatedAt)
            changingArr[it].updatedAt = newArr[it].updatedAt;

          if (typeof newArr[it].working != 'undefined' && !(typeof changingArr[it].working != 'undefined' && changingArr[it].working == newArr[it].working))
            changingArr[it].working = newArr[it].working;
          if (newArr[it].workingStatus)
            changingArr[it].workingStatus = newArr[it].workingStatus;
          if (newArr[it].failedCount)
            changingArr[it].failedCount = newArr[it].failedCount;

        } else {
          changingArr[it] = newArr[it];
        }
      }
      else {
        changingArr.push(newArr[it])
      }
    }
  };
  this.viewChinesefiy = function (arr) {
    console.log(arr);
    arr.map(function (item) {
      var status = item.working?item.workingStatus:item.status;
      switch (status){
        case "uploading":
          item.statusLocalized = "上传中";
          break;
        case "pausing...":
          item.statusLocalized = "暂停中";
          break;
        case "paused":
          item.statusLocalized = "已暂停";
          break;
        case "resuming...":
          item.statusLocalized = "恢复中";
          break;
        case "finished":
          item.statusLocalized = "已完成";
          break;
        case "failed":
          item.statusLocalized = "已失败";
          break;
        case "aborting...":
          item.statusLocalized = "放弃中";
          break;
        default:
          item.statusLocalized = status;
      }
    });
  }
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
    logger.debug('app.config');
  }])
  .run(['Session', 'AuthService', 'SettingService', '$state', '$timeout', '$interval', '$state', '$rootScope','api',
    function (Session, AuthService, SettingService, $state, $timeout, $interval, $state, $rootScope,api) {

      logger.debug('app.run');

      try{
        /**
         * set varsion number
         */
        $rootScope.$appVersion = _BackendService.appConfig.projectConfig.versionNumber;

        /**
         * page change check
         */
        $rootScope.$on('$stateChangeStart',
          function (event, toState, toParams, fromState, fromParams) {

            //state control
            logger.debug('stateChange -------', fromState.name +' ---> '+ toState.name);
            if(!AuthService.isAuthenticated() && toState.name != 'settings' && toState.name != 'login' && toState.name != ''){
              logger.debug('catched illegal state change!',!AuthService.isAuthenticated());
              $state.go('login');
            }


            if ($rootScope.uploadControllerScope && $rootScope.uploadControllerScope.intervalId) {
              logger.debug('$interval pause : ',$rootScope.uploadControllerScope.intervalId);
              $interval.cancel($rootScope.uploadControllerScope.intervalId);
            }

          }
        );
        $rootScope.$on('$stateNotFound',
          function(event, unfoundState, fromState, fromParams){
            logger.debug('$stateNotFound -------', fromState.name +' ---> '+ unfoundState.name);
            console.log(unfoundState.to); // "lazy.state"
            console.log(unfoundState.toParams); // {a:1, b:2}
            console.log(unfoundState.options); // {inherit:false} + default options
          })
        
        /**
         * get settings
         */
        $timeout(function () {
          logger.debug('getting settings......');
          SettingService.loadSettings()
          .then(function (result) {
            /**
             * auth check
             */
            $timeout(function () {
              logger.debug('go to login page......');
              AuthService.gotoLogin();
            }, 500);
          });
        },0)
        

      }catch (err){
        logger.debug(err,err.stack);
      }
      
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
    'ui.bootstrap',
    'smart-table',
  ])
  .config(['$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {

      // For any unmatched url, send to /status
      $urlRouterProvider.otherwise("/login");

      $stateProvider
      .state('upload', {
        url: "/upload",
        templateUrl: './views/dashboard/upload.html',
      })
      .state('login', {
        url: "/login",
        templateUrl: './views/dashboard/auth.html',
        params:{'isAutoLogin':{}}
      })
      .state('settings', {
        url: "/settings",
        templateUrl: './views/dashboard/settings.html',
        params:{'preState':{}}
      })
      .state('history', {
        url: "/history",
        templateUrl: './views/dashboard/history.html',
      })
    }]);
  app.filter('fileRecord', function() {
    return function (file) {

    }
  });
  })();
/**
 * service api
 */
(function () {
  var logger = require('../../dist/util').util.logger.getLogger('serviceApi');

  angular.module('Uploader.services')
  .service('api', ['$http', '$rootScope', 'serverUrl', 'Session', '$timeout', 'DomChangeService', '$state', 'AuthService',
    function ($http, $rootScope, serverUrl, Session, $timeout, DomChangeService, $state, AuthService) {
      var LOCAL_BASE_TOKEN_KEY = 'baseToken';
      var LOCAL_CURRENT_USER = 'currentUser';
      var api = this;

      /**
       * auth api
       */
      this.login = function (query, $scope, $rScope) {
        return _BackendService.serverApi.authenticate(query.username, query.password)
        .then(function (result) {
          Session.set(LOCAL_BASE_TOKEN_KEY, result.data.token);
          Session.set(LOCAL_CURRENT_USER, result.data.currentUser);
          AuthService.loadCredentials();
          logger.debug('login success!!!!!!');
          //restore username and password
          var s = {
            username: query.username,
            password: query.password,
            rememberPassword: $scope.rememberPassword ? '1' : '0',
            autoLogin: $scope.autoLogin ? '1' : '0',
          }
          api.setSettings({settings:s}).then(function (result) {
            $rootScope.$settings = result;
          })
          //$scope.alerts = [];
          //$scope.alerts.push({ type: 'success', msg: '登陆成功.正在跳转到主页面...' });
          $scope.$apply();
          $timeout(function () {
            //set ui
            $rScope.showLogout = true;
            DomChangeService.changeToUsingStyle();
            //jump to main page
            $state.go('upload');
          }, 1000);
        })
        .catch(function (err) {
          logger.debug(err);
          $scope.alerts = [];
          if(err.message == 'authenticate failed') err.message = '错误的用户名或密码.';
          $scope.alerts.push({ type: 'warning', msg: '登录失败,原因: ' + err.message });
          $scope.loginButton = '登录';
          $scope.$apply();
        });
      };

      this.logout = function ($rScope) {
        return _BackendService.serverApi.deauthenticate()
        .then(() => {
          Session.set(LOCAL_BASE_TOKEN_KEY, null);
          Session.set(LOCAL_CURRENT_USER, null);
          AuthService.loadCredentials();
          logger.debug('logout success!!!!!!');
          $rScope.showLogout = false;
          DomChangeService.changeToLoginStyle();
          //$window.location.hash = '#/login';
          $state.go('login');
          //$rScope.$apply();
        }).catch(function (err) {
          logger.debug(err.message, err.stack);
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

      this.recoverIfUnfinished = function ($scope) {
        var currentUser = _BackendService.serverApi.getBaseUser();
        if (!currentUser) {
          $state.go('login');
          return;
        }
        co(function*() {
          let r = yield _FileInfo.listUploadingFiles(currentUser.id);
          if (r.length > 0) {
            const { dialog } = require('electron').remote;
            var buttonIndex = dialog.showMessageBox({
              type: 'info',
              buttons: ['确认'],
              title: '恢复上传',
              message: '已经恢复上次未完成的上传'
            }, function () {
            });
            $scope.uploading = true;
            $scope.stopCount = 5;
            _BackendService.uploadRecovery.recover(r);
          }
        });
      }
      this.stopAll = function () {
        return _BackendService.fileUpload.stopAllUploading()
      }

      /**
       * manual upload api
       */
      this.getFileInfoList = function () {
        var currentUser = _BackendService.serverApi.getBaseUser();
        if (!currentUser) {
          $state.go('login');
          return Promise.reject('no currentUser');
        }
        return _FileInfo.listFiles(currentUser.id)
        .then(function (r) {
          return { fileInfoList: r }
        })
      }

      this.uploadFile = function (data) {
        var project = data.project;
        var fileList = data.fileList;
        var syncId = new Date().getTime().toString();
        co(function*() {
          let r = yield _BackendService.fileUpload.uploadFiles(project, fileList, syncId, { afterDelete: false });
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
        return co(function*() {
          let r = yield _BackendService.fileUpload.uploadFiles(null, [], syncId, { afterDelete: false });
          return r;
        })
        .catch((err) => {
          logger.error(err, err.stack);
          throw err;
        });
      }

      this.abortUploadFile = function (syncId) {
        return co(function*() {
          let result = yield _BackendService.fileUpload.abortUploadFiles(syncId);
          return result;
        })
        .catch((err) => {
          logger.error(err, err.stack);
        });
      }

      this.getProjects = function () {
        return _BackendService.serverApi.getGenoProjects()
      }

      this.getAllUploadRecords = function () {
        return this.getProjects().then(function (projects) {
          if(projects.length > 0){
            return _BackendService.serverApi.getAllRecords(projects[0].id);
          }else{
            logger.error('no projects!');
            return Promise.resolve([]);
          }
        })
      }

      /**
       * settings api
       */

      this.setSettings = function (data) {
        var settings = data.settings;
        return co(function*() {
          yield result = _BackendService.uploadSetting.setConfig(settings);
          return result;
        }).catch(err => {
          logger.error(err, err.stack);
        });
      }

      this.getSettings = function () {
        return _BackendService.uploadSetting.getConfig()
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
  .service('AuthService', ['$rootScope', '$state', '$window', 'Session', authService]);

  function authService($rootScope, $state, $window, Session) {
    var LOCAL_BASE_TOKEN_KEY = 'baseToken';
    var LOCAL_CURRENT_USER = 'currentUser';

    var authService = this;

    $rootScope.$on('invalidTokenEvent', function () {
      authService.gotoLogin();
    });

    this.gotoLogin = function () {
      this.useCredentials(null, null);
      var currentState = $state.current.name;
      if($rootScope.$settings.autoLogin == 1){
        $state.go('login',{isAutoLogin:true},{reload: true});
      }else{
        $state.go('login',{},{reload: true});
      }
      
    }

    this.loadCredentials = function () {
      var token = Session.get(LOCAL_BASE_TOKEN_KEY);
      var currentUser = Session.get(LOCAL_CURRENT_USER);
      this.useCredentials(token, currentUser);
      logger.debug('authservice---',token,currentUser)
      return token;
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
 * service DomChangeService
 */
(function () {

  angular.module('Uploader.services')
  .service('DomChangeService', [function () {

    var displayNoneStyle = 'display:none';
    var displayBlockStyle = 'display:block';

    var unfullContentClass = 'col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2 main';
    this.changeToUsingStyle = function () {
      var loginShowElements = document.getElementsByClassName('loginShow');
      for(var i=0;i<loginShowElements.length;i++){
        angular.element(loginShowElements[i]).attr('style', displayBlockStyle);
      }
      angular.element(document.getElementById('sideNavBar')).attr('style', displayBlockStyle);
    }
    this.changeToLoginStyle = function () {
      
      var loginShowElements = document.getElementsByClassName('loginShow');
      for(var i=0;i<loginShowElements.length;i++){
        angular.element(loginShowElements[i]).attr('style', displayNoneStyle);
      }
      angular.element(document.getElementById('sideNavBar')).attr('style', displayNoneStyle);
    }
  }])

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

    var LOCAL_GenoServerUrl = 'GenoServerUrl';

    var settingService = this;

    this.loadSettings = function () {
      return api.getSettings()
      .then(function (result) {
        $rootScope.$settings = result.settings;
        return result.settings;
      })
    }

    this.setSettings = function (settings) {
      var settingsJSON = {
        GenoServerUrl: settings.GenoServerUrl,
      };
      return api.setSettings({ settings: settingsJSON })
      .then(function (result) {
        $rootScope.$settings = result;
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

  angular.module('Uploader.views').controller('AuthController', ['$scope', '$rootScope', 'api', '$stateParams', '$timeout', authController]);
  function authController($scope, $rootScope, api, $stateParams, $timeout) {

    //clear upload page state
    $rootScope.uploadControllerScope = null;
    $rootScope.showLogout = false;
    $scope.alerts = [
      /*{ type: 'warning', msg: 'Oh snap! Change a few things up and try submitting again.' }}*/
    ];
    //var logoutLink = document.getElementById('logoutLink');
    //angular.element(logoutLink).attr('style','display:none');
    //$scope.errorMessage = '';
    $scope.loginButton = '登录';
    $scope.closeAlert = function (index) {
      $scope.alerts.splice(index, 1);
    };
    $scope.doLogin = function () {
      if ($scope.username && $scope.password) {
        var data = {
          username: $scope.username,
          password: $scope.password,
        };
        $scope.loginButton = '登录中...';
        api.login(data, $scope, $rootScope);
      } else {
        $scope.alerts = [];
        $scope.alerts.push({ type: 'warning', msg: '您必须输入用户名和密码.' });
        $scope.loginButton = '登录';
      }
    };
    $scope.clickAutoLogin = function () {
      $timeout(function () {
        //logger.debug('clickAutoLogin--->$scope.autoLogin:', $scope.autoLogin, '$scope.rememberPassword:', $scope.rememberPassword)
        if ($scope.autoLogin == true) {
          $scope.rememberPassword = true;
          //logger.debug('clickAfter---->$scope.autoLogin:', $scope.autoLogin, '$scope.rememberPassword:', $scope.rememberPassword)
        }
      }, 20)
    }
    $scope.clickRememberPwd = function () {
      $timeout(function () {
        //logger.debug('clickAutoLogin--->$scope.autoLogin:', $scope.autoLogin, '$scope.rememberPassword:', $scope.rememberPassword)
        if ($scope.rememberPassword == false) {
          $scope.autoLogin = false;
          //logger.debug('clickAfter---->$scope.autoLogin:', $scope.autoLogin, '$scope.rememberPassword:', $scope.rememberPassword)
        }
      }, 20)
    }
    logger.debug('$stateParams', $stateParams,$rootScope.$settings)
    if ($rootScope.$settings) {
      $scope.username = $rootScope.$settings.username;
      $scope.rememberPassword = $rootScope.$settings.rememberPassword == '1' ? true : false;
      $scope.autoLogin = $rootScope.$settings.autoLogin == '1' ? true : false;
      if ($scope.rememberPassword == 1) {
        $scope.password = $rootScope.$settings.password;
      }
    }

    //aoto login
    if ($stateParams.isAutoLogin === true) {
      $scope.doLogin();
    }
  }

})();
/**
 * HistoryController
 */
(function () {

  angular.module('Uploader.views').controller('HistoryController', ['$scope', 'api', '$interval', '$state', historyController]);
  function historyController($scope, api, $interval, $state) {
    //logger.debug('$rootScope.historyControllerScope --> $scope');
    $scope.fileList = [];
    // var i = 0;
    // do {
    //   i++;
    //   $scope.fileList.push({
    //     "id": "2ed9dac7-1c44-42d5-a919-0cbea4eff659" + i,
    //     "name": "abc" + i,
    //     "objectKey": "projects/a33ced47-6b64-467f-9550-5615d61c141d",
    //     "reference": 1,
    //     "size": i,
    //     "public": false,
    //     "uploadRegion": "oss-cn-qingdao",
    //     "uploadBucket": "curacloud-geno-test",
    //     "uploadPercent": i,
    //     "uploadCheckpoint": null,
    //     "finished": true,
    //     "deleted": false,
    //     "createdAt": "2016-09-12T08:31:54.000Z",
    //     "updatedAt": "2016-09-12T08:31:54.000Z"
    //   });
    // } while ($scope.fileList.length < 500);
    $scope.pageCount = 8;
    $scope.displayedPages = 9;
    api.getAllUploadRecords()
    .then(function (fileList) {
      
      $scope.fileList = fileList.map(function (item) {
        return item.source; 
        //$scope.fileList.push(item.source);
      });
      //console.log($scope.fileList);
      utils.formatList($scope.fileList, $scope.fileList);
      $scope.$digest();
    })


    $scope.backToMain = function(){
      $state.go('upload');
    }
    $scope.download = function(fileId){
    }
  }

  /**
   *
   */

})();
/**
 * SettingController
 */
(function () {

  angular.module('Uploader.views').controller('SettingsController', ['$state','$stateParams','$scope', '$rootScope', 'SettingService', 'api', settingController]);
  function settingController($state,$stateParams,$scope, $rootScope, SettingService, api) {
    $scope.GenoServerUrl = $rootScope.$settings.GenoServerUrl;
    $scope.alerts = [
      /*{ type: 'warning', msg: 'Oh snap! Change a few things up and try submitting again.' }}*/
    ];
    $scope.closeAlert = function (index) {
      $scope.alerts.splice(index, 1);
    };
    
    $scope.saveSettings = function () {

      SettingService.setSettings({
        GenoServerUrl: $scope.GenoServerUrl,
      }).then(function (result) {
        $scope.alerts.push({type: 'success', msg: '保存设置成功!'});
        $scope.$apply();
      })
    }
    
    $scope.backToPreState = function () {
      $state.go($stateParams.preState)
      //window.history.back();
    }
  };

})();
/**
 * UploaderController
 */
(function () {

  angular.module('Uploader.views').controller('UploadController', ['$rootScope', 'api', '$interval', '$uibModal', uploadController]);
  function uploadController($rootScope, api, $interval, $uibModal) {
    logger.debug('$rootScope.uploadControllerScope --> $scope');
    var getFileUplodStatuses = function ($scope) {
      $scope.intervalId = $interval(function () {
        if($scope.uploading) {
          getFileList($scope);
        }
      }, 1000);
    };

    var getFileList = function ($scope) {
      return api.getFileInfoList().then(
        function (result) {
          if (result.fileInfoList) {
            var activeItems =[];
            result.fileInfoList.map(function (item) {
              if(item.status != 'finished')
                activeItems.push(item);
            })
            //logger.debug(activeItems);
            if(activeItems.length == 0){
              $scope.stopCount--;
              if(!$scope.stopCount) $scope.uploading = false;
            }else{
              $scope.stopCount = 5;
            }
            if (!$scope.fileInfoList) {
              utils.formatList(result.fileInfoList, result.fileInfoList);
              $scope.fileInfoList = result.fileInfoList;
            } else {
              utils.formatList(result.fileInfoList, $scope.fileInfoList);
              //$scope.oldfileInfoList = angular.copy($scope.fileInfoList);
              utils.minAssignList($scope.fileInfoList, result.fileInfoList);
            }
            utils.viewChinesefiy($scope.fileInfoList);
          }
        }
      );
    }

    if (!$rootScope.uploadControllerScope) {
      const { dialog } = require('electron').remote;
      //check for recover only once
      console.log('check for recover only once')
      $rootScope.uploadControllerScope = {};
      var $scope = $rootScope.uploadControllerScope;
      api.recoverIfUnfinished($scope);
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
      $scope.stopCount = 5;
      $scope.uploading = false;
      $scope.chosenFileList = [];
      getFileList($scope);
      getFileUplodStatuses($scope);

      $scope.browseAndUpload = function () {
        var path = dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] });
        if (path) {
          var fileSection = true;
          var files = [];
          try {
            path.map(function (p) {
              var stat = require('fs').statSync(p);
              if (!stat.isFile()) {
                throw p + ' is not a file';
              }else{
                files.push({filePath: p, size: stat.size});
              }
            })
          }catch(err) {
            fileSection = false;
          }
          if (fileSection) {
            $scope.chosenFileList = [];
            files.map(function (file) {
              $scope.chosenFileList.push({
                filePath: file.filePath,
                size: file.size
              });
            })
            
            $scope.message = '';
            //openUploadModal();

            //hide the project chooser and use the first project,then upload
            api.getProjects().then(function (list) {
              logger.debug('got project:', list);
              if (list[0]) {
                $scope.uploading = true;
                return api.uploadFile({
                  project: list[0],
                  fileList: $scope.chosenFileList,
                })
              } else {
                dialog.showMessageBox({
                  type: 'error',
                  buttons: ['确认'],
                  title: 'error',
                  message: '您没有上传的权限'
                }, function () {
                })
              }
            })
            .catch(function (err) {
              logger.debug(err);
              if(typeof err == 'string'){
                var msg = err;
                err = {};
                err.message = '无法上传:' + msg;
              }
              else if (err.message.indexOf('ENOTFOUND') > 0 || err.message.indexOf('ENOENT') > 0) {
                err.message = '无法连接至网络,请检查网络连接后重试';
              }
              dialog.showMessageBox({
                type: 'error',
                buttons: ['确认'],
                title: 'error',
                message: '上传失败,原因:' + err.message,
              }, function () {
              })
            })

          } else {
            $scope.message = '文件选择错误!请重新选择';
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
        $scope.dcmDir = dialog.showOpenDialog({ properties: ['openFile'] });
      };
      $scope.pauseUpload = function (sId) {
        $scope.fileInfoList.map(function (o) {
          if (o.syncId == sId) {
            o.working = true;
            o.workingStatus = 'pausing...';
            o.statusLocalized = '暂停中';
          }
        });
        api.stopUploadFile(sId).then(function () {
        });
      };
      $scope.resumeUpload = function (sId) {
        $scope.fileInfoList.map(function (o) {
          if (o.syncId == sId) {
            o.working = true;
            o.workingStatus = 'resuming...';
            o.statusLocalized = '恢复中';
            if (o.status == 'failed') {
              o.failedCount = 0;
            }
          }
        });
        $scope.uploading = true;
        $scope.stopCount = 5;
        api.resumeUploadFile(sId).then(function () {
        })
        .catch(function (err) {
          dialog.showMessageBox({ type: 'error', buttons: ['确认'], title: 'error', message: '上传失败,请稍后重试' }, function () {
          })
        })
      };
      $scope.abortUpload = function (sId) {
        var buttonIndex = dialog.showMessageBox({
          type: 'question',
          buttons: ['确认', '取消'],
          title: '取消上传',
          message: '确认取消该文件的上传吗?'
        })
        if (buttonIndex == 0) {
          $scope.fileInfoList.map(function (o) {
            if (o.syncId == sId) {
              o.working = true;
              o.workingStatus = 'aborting...';
              o.statusLocalized = '放弃中';
            }
          });
          api.abortUploadFile(sId).then(function (result) {
            logger.debug(result);
            if (!result.success) {
              dialog.showMessageBox({
                type: 'error',
                buttons: ['确认'],
                title: 'error',
                message: '取消上传失败,请检查网络连接'
              }, function () {
              })
            }
          });
        }

      };

    } else if ($rootScope.uploadControllerScope && $rootScope.uploadControllerScope.intervalId) {
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

  angular.module('Uploader.views').controller('UserController', ['$state', '$scope', '$rootScope', 'api', 'serverUrl', userController]);
  function userController($state, $scope, $rootScope, api, serverUrl) {

    $rootScope.showLogout = true;
    //var logoutLink = document.getElementById('logoutLink');
    //angular.element(logoutLink).attr('style','display:block');
    $scope.doLogout = function () {
      //alert('123123123');
      //if($rootScope.uploadControllerScope)
      api.stopAll().then(function () {
        api.logout($rootScope);
      })
    };
    // $scope.goSettings = function () {
    //   $state.reload().then(function (currentState) {
    //     console.log(currentState);
    //     $state.go('settings', { preState: currentState.name })
    //   }).catch(function (err) {
    //     console.log(err.message,err.stack);
    //   });
    // }
    $scope.goSettings = function () {
      $state.go('settings', { preState: $state.current.name })
    }
  }

})();