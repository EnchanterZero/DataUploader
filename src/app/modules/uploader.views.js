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