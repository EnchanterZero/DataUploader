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