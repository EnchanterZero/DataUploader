/**
 * AuthController
 */
(function () {

  angular.module('Uploader.views').controller('AuthController', ['$scope', '$rootScope', 'api', 'serverUrl', authController]);
  function authController($scope, $rootScope, api, serverUrl) {

    //clear upload page state
    $rootScope.uploadControllerScope = null;
    $rootScope.showLogout = false;
    $scope.alerts = [
      /*{ type: 'warning', msg: 'Oh snap! Change a few things up and try submitting again.' }}*/
    ];
    //var logoutLink = document.getElementById('logoutLink');
    //angular.element(logoutLink).attr('style','display:none');
    //$scope.errorMessage = '';
    $scope.loginButton = '登录';
    $scope.closeAlert = function (index) {
      $scope.alerts.splice(index, 1);
    };
    $scope.doLogin = function () {
      if ($scope.username && $scope.username) {
        var data = {
          username: $scope.username,
          password: $scope.password,
        };
        $scope.loginButton = '登录中...';
        api.login(data, $scope, $rootScope);
      } else {
        $scope.alerts.push({ type: 'warning', msg: 'username and password must be provided.' });
        $scope.loginButton = '登录';
      }
    };
  }

})();