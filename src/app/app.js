//require backend services
var _BackendService = require('../../dist/services');
var _FileInfo = require('../../dist/modules/fileinfo');
var _Config = require('../../dist/modules/config');
var co = require('co');

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
      $urlRouterProvider.otherwise("/upload");

      $stateProvider
      // .state('status', {
      //   url: "/status",
      //   templateUrl: 'views/dashboard/status.html',
      // })
      .state('upload', {
        url: "/upload",
        templateUrl: './views/dashboard/upload.html',
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
        var token = AuthService.loadCredentials();
        if (!AuthService.isAuthenticated()) {
          $window.alert('请先登录!');
          $timeout(function () {
            AuthService.gotoLogin();
          }, 0);
        } else {
          api.setUserToken({ token: token })
          .then(function () {

          });
        }

      }catch (err){
        console.log(err,err.stack);
      }
      
      /**
       * page change check
       */
      $rootScope.$on('$stateChangeStart',
        function (event, toState, toParams, fromState, fromParams) {
          if ($rootScope.statusControllerScope && $rootScope.statusControllerScope.intervalId) {
            //console.log('$interval pause : ',$rootScope.statusControllerScope.intervalId);
            $interval.cancel($rootScope.statusControllerScope.intervalId);
          }
          if ($rootScope.uploadControllerScope && $rootScope.uploadControllerScope.intervalId) {
            //console.log('$interval pause : ',$rootScope.autoScanControllerScope.intervalId);
            $interval.cancel($rootScope.uploadControllerScope.intervalId);
          }
          if ($rootScope.autoScanControllerScope && $rootScope.autoScanControllerScope.intervalId) {
            //console.log('$interval pause : ',$rootScope.autoScanControllerScope.intervalId);
            $interval.cancel($rootScope.autoScanControllerScope.intervalId);
          }
        }
      );
    }]);

})();