/**
 * UserController
 */
(function () {

  angular.module('Uploader.views').controller('UserController', ['$state', '$scope', '$rootScope', 'api', 'serverUrl', userController]);
  function userController($state, $scope, $rootScope, api, serverUrl) {

    $rootScope.showLogout = true;
    //var logoutLink = document.getElementById('logoutLink');
    //angular.element(logoutLink).attr('style','display:block');
    $scope.doLogout = function () {
      //alert('123123123');
      //if($rootScope.uploadControllerScope)
      api.stopAll().then(function () {
        api.logout($rootScope);
      })
    };
    // $scope.goSettings = function () {
    //   $state.reload().then(function (currentState) {
    //     console.log(currentState);
    //     $state.go('settings', { preState: currentState.name })
    //   }).catch(function (err) {
    //     console.log(err.message,err.stack);
    //   });
    // }
    $scope.goSettings = function () {
      $state.go('settings', { preState: $state.current.name })
    }
  }

})();