/**
 * AuthController
 */
(function () {

  angular.module('Uploader.views').controller('AuthController', ['$scope', '$rootScope', 'api', '$stateParams', '$timeout', authController]);
  function authController($scope, $rootScope, api, $stateParams, $timeout) {

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
        $scope.alerts = [];
        $scope.alerts.push({ type: 'warning', msg: 'username and password must be provided.' });
        $scope.loginButton = '登录';
      }
    };
    $scope.clickAutoLogin = function () {
      $timeout(function () {
        //logger.debug('clickAutoLogin--->$scope.autoLogin:', $scope.autoLogin, '$scope.rememberPassword:', $scope.rememberPassword)
        if ($scope.autoLogin == true) {
          $scope.rememberPassword = true;
          //logger.debug('clickAfter---->$scope.autoLogin:', $scope.autoLogin, '$scope.rememberPassword:', $scope.rememberPassword)
        }
      }, 20)
    }
    $scope.clickRememberPwd = function () {
      $timeout(function () {
        //logger.debug('clickAutoLogin--->$scope.autoLogin:', $scope.autoLogin, '$scope.rememberPassword:', $scope.rememberPassword)
        if ($scope.rememberPassword == false) {
          $scope.autoLogin = false;
          //logger.debug('clickAfter---->$scope.autoLogin:', $scope.autoLogin, '$scope.rememberPassword:', $scope.rememberPassword)
        }
      }, 20)
    }
    logger.debug('$stateParams', $stateParams,$rootScope.$settings)
    if ($rootScope.$settings) {
      $scope.username = $rootScope.$settings.username;
      $scope.rememberPassword = $rootScope.$settings.rememberPassword == '1' ? true : false;
      $scope.autoLogin = $rootScope.$settings.autoLogin == '1' ? true : false;
      if ($scope.rememberPassword == 1) {
        $scope.password = $rootScope.$settings.password;
      }
    }

    //aoto login
    if ($stateParams.isAutoLogin === true) {
      $scope.doLogin();
    }
  }

})();