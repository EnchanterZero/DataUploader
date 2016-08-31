
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
  .run(['Session', 'AuthService', 'SettingService', '$state', '$timeout', '$interval', '$state', '$rootScope', 'api',
    function (Session, AuthService, SettingService, $state, $timeout, $interval, $state, $rootScope, api) {

      logger.debug('app.run');

      try{
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
        SettingService.loadSettings();

        /**
         * auth check
         */
        //$window.alert('请先登录!');
        $timeout(function () {
          AuthService.gotoLogin();
        }, 0);

      }catch (err){
        logger.debug(err,err.stack);
      }
      
    }]);

})();