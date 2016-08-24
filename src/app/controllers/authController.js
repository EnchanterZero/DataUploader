/**
 * AuthController
 */
(function () {

  angular.module('Uploader.views').controller('AuthController', ['$scope', '$rootScope', 'api', 'serverUrl', authController]);
  function authController($scope, $rootScope, api, serverUrl) {

    //clear upload page state
    $rootScope.uploadControllerScope = null;
    $rootScope.showLogout=false;
    $scope.errorMessage = '';
    $scope.doLogin = function () {
      var data = {
        username: $scope.username,
        password: $scope.password,
      };
      api.login(data, $scope,$rootScope);
    };
  }

})();