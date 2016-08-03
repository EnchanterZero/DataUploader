/**
 * Uploader.config
 */
(function () {
  'use strict';

  var app = angular.module('CuraCloudAdmin.config', []);

  var config_data = {
    'baseUrl': 'http://localhost:3000',

    'taskTypeOptions': {
      'DicomToMHA': 'DICOM_TO_MHA',
      'DeepVessel': 'PROCESS_MODEL',
      'UpdateFFR': 'UPDATE_FFR',
    },

    'taskStatus': {
      'dicomToMHA': {
        'pending': 'DICOM_TO_MHA_PENDING',
        'failed': 'DICOM_TO_MHA_FAILED',
        'complete': 'DICOM_TO_MHA_SUCCESS',
      },
      'deepVessel': {
        'pending': 'PROCESS_PENDING',
        'failed': 'PROCESS_FAILED',
        'complete': 'PROCESS_SUCCESS',
      },
    },
  };

  angular.forEach(config_data, function (value, key) {
    app.constant(key, value);
  });
})();

/**
 * Uploader.services
 */
(function () {

})();

/**
 * Uploader.views
 */
(function () {
  var dashboardApp = angular.module('Uploader.Dashboard', [
    'ui.router',
  ])
  .config(['$stateProvider','$urlRouterProvider',
    function ($stateProvider,$urlRouterProvider) {

      // For any unmatched url, send to /route1
      //$urlRouterProvider.otherwise("/status");

      $stateProvider
      .state('login', {
        url: "/login",
        templateUrl: 'views/signin/auth.html',
        controller: 'AuthController'
      })
      .state('status', {
        url: "/status",
        templateUrl: 'views/dashboard/status.html',
        controller: ''
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
      $timeout(function () {
        AuthService.gotoLogin();
      }, 0);
    }
  }]);


  uploaderApp.run(['Session', 'AuthService', '$state', '$timeout', '$window', function (Session, AuthService, $state, $timeout, $window) {
    console.log('app.run');
    AuthService.loadCredentials();
    if (!AuthService.isAuthenticated()) {
      //$timeout(function () {
        AuthService.gotoLogin();
      //}, 0);
    }
  }]);
  
  
  /**
   * directives
   */
  
  /**
   * constant configs
   */
  var config_data = {
    'serverUrl': 'http://localhost:3002',

  };
  angular.forEach(config_data, function (value, key) {
    uploaderApp.constant(key, value);
    //dashboardApp.constant(key, value);
  });

})();