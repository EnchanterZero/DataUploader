/**
 * service AuthService
 */
(function () {

  angular.module('Uploader.services')
  .service('AuthService', ['$rootScope', '$state', '$window', 'api', 'Session', authService]);

  function authService($rootScope, $state, $window, api, Session) {
    var LOCAL_BASE_TOKEN_KEY = 'baseToken';
    var LOCAL_CURRENT_USER = 'currentUser';

    var authService = this;

    $rootScope.$on('invalidTokenEvent', function () {
      authService.gotoLogin();
    });

    this.gotoLogin = function () {
      this.useCredentials(null, null);
      var currentState = $state.current.name;
      $window.location.hash = '#/login';
    }

    this.loadCredentials = function () {
      // var token = Session.get(LOCAL_BASE_TOKEN_KEY);
      // var currentUser = Session.get(LOCAL_CURRENT_USER);
      var token = _BackendService.serverApi.getBaseAuthToken();
      var currentUser = _BackendService.serverApigetBaseUser();
      this.useCredentials(token, currentUser);
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