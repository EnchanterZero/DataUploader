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