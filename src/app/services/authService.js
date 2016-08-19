/**
 * service AuthService
 */
(function () {

  angular.module('Uploader.services')
  .service('AuthService', ['$rootScope', '$state', '$window', 'api', 'Session', authService]);

  function authService($rootScope, $state, $window, api, Session) {
    var LOCAL_TOKEN_KEY = 'token';
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
      var token = Session.get(LOCAL_TOKEN_KEY);
      var currentUser = Session.get(LOCAL_CURRENT_USER);
      this.useCredentials(token, currentUser);
      return token;
    }

    this.useCredentials = function (token, currentUser) {
      this.token = token;
      this.currentUser = currentUser;
      $rootScope.$isAuthenticated = !!token;
      api.setAuthToken(token);
    }

    this.isAuthenticated = function () {
      return !!this.token;
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