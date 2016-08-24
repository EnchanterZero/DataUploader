/**
 * UserController
 */
(function () {

  angular.module('Uploader.views').controller('UserController', ['$scope','$rootScope', 'api', 'serverUrl', userController]);
  function userController($scope,$rootScope, api, serverUrl) {

    $rootScope.showLogout=true;
    $scope.doLogout = function () {
      //alert('123123123');
      api.logout($rootScope);
    };
  }

})();