/**
 * UserController
 */
(function () {

  angular.module('Uploader.views').controller('UserController', ['$scope', '$http', '$window', 'Session', 'api', 'serverUrl', userController]);
  function userController($scope, $http, $window, Session, api, serverUrl) {

    $scope.doLogout = function () {
      //alert('123123123');
      api.logout();
    };
  }

})();