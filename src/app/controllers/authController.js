/**
 * AuthController
 */
(function () {

  angular.module('Uploader.views').controller('AuthController', ['$scope', '$http', '$window', 'Session', 'api', 'serverUrl', authController]);
  function authController($scope, $http, $window, Session, api, serverUrl) {

    $scope.doLogin = function () {
      var data = {
        username: $scope.username,
        password: $scope.password,
      };
      api.login(data, $scope);
    };
  }

})();