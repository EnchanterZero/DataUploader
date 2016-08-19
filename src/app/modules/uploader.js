
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
        // var token = AuthService.loadCredentials();
        // if (!AuthService.isAuthenticated()) {
        $window.alert('请先登录!');
        $timeout(function () {
          AuthService.gotoLogin();
        }, 0);
        // } else {
        //   api.setUserToken({ token: token })
        //   .then(function () {
        //
        //   });
        // }

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