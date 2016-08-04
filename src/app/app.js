/**
 * Uploader.config
 */
(function () {
  'use strict';

  var app = angular.module('Uploader.config', []);

  var config_data = {
    'serverUrl': 'http://localhost:3002',
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
  ])
  .config(['$stateProvider','$urlRouterProvider',
    function ($stateProvider,$urlRouterProvider) {

      // For any unmatched url, send to /status
      $urlRouterProvider.otherwise("/status");

      $stateProvider
      .state('status', {
        url: "/status",
        templateUrl: 'views/dashboard/status.html',
        controller: 'StatusController'
      })
      .state('upload', {
        url: "/upload",
        templateUrl: 'views/dashboard/upload.html',
        controller: 'UploadController'
      })
      .state('autoscan', {
        url: "/autoscan",
        templateUrl: 'views/dashboard/autoscan.html',
        controller: 'AutoScanController'
      })
      .state('autopush', {
        url: "/autopush",
        templateUrl: 'views/dashboard/autopush.html',
        controller: 'AutoPushController'
      })
      .state('history', {
        url: "/history",
        templateUrl: 'views/dashboard/history.html',
        controller: 'HistoryController'
      })
      .state('settings', {
        url: "/settings",
        templateUrl: 'views/dashboard/settings.html',
        controller: 'SettingController'
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
    'Uploader.views',
    'Uploader.services',
  ]);

  app.config(['$stateProvider', function ($stateProvider) {
    console.log('app.config');
  }])
  .run(['Session', 'AuthService', '$state', '$timeout', '$window', function (Session, AuthService, $state, $timeout, $window) {
    console.log('app.run');
    AuthService.loadCredentials();
    if (!AuthService.isAuthenticated()) {
      $window.alert('请先登录!');
      $timeout(function () {
        AuthService.gotoLogin();
      }, 0);
    }
  }]);

})();