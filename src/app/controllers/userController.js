/**
 * UserController
 */
(function () {

  angular.module('Uploader.views').controller('UserController', ['$scope','$rootScope', 'api', 'serverUrl', userController]);
  function userController($scope,$rootScope, api, serverUrl) {

    $rootScope.showLogout=true;
    //var logoutLink = document.getElementById('logoutLink');
    //angular.element(logoutLink).attr('style','display:block');
    $scope.doLogout = function () {
      //alert('123123123');
      //if($rootScope.uploadControllerScope)
      api.stopAll().then(function () {
        api.logout($rootScope);
      })
    };
  }

})();