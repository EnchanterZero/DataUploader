
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
  .run(['Session', 'AuthService', 'SettingService', '$state', '$timeout', '$interval', '$state', '$rootScope','DomChangeService',
    function (Session, AuthService, SettingService, $state, $timeout, $interval, $state, $rootScope,DomChangeService) {

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
              //return;
            }
            // else {
            //   if(fromState.name == 'upload' && toState.name == 'history'){
            //     DomChangeService.changeToHistoryStyle();
            //    
            //   }
            //   else if(fromState.name == 'history' && toState.name == 'upload'){
            //     DomChangeService.changeToMainStyle();
            //   }
            //   $rootScope.$digest();
            //  
            // }


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