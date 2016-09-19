/**
 * UserController
 */
(function () {

  angular.module('Uploader.views').controller('UserController', ['$state', '$scope', '$rootScope', 'api', 'DomChangeService', userController]);
  function userController($state, $scope, $rootScope, api, DomChangeService) {

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
    $scope.historyLinkText = '上传记录';
    var stateName = null;
    $scope.goSettings = function () {
      $state.go('settings', { preState: $state.current.name })
    }
    $scope.backToMain = function(){
      logger.debug($state)
      $state.go('upload');
    }
    $scope.goHistory = function () {
      logger.debug($state)
      $state.go('history');
    }
    $scope.go = function () {
      if($state.current.name == 'history'){
        $state.go('upload');
        $scope.historyLinkText = '上传记录';
      }
      else{
        $state.go('history');
        $scope.historyLinkText = '返回';
      }
    }
  }

})();