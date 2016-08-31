/**
 * SettingController
 */
(function () {

  angular.module('Uploader.views').controller('SettingsController', ['$state','$stateParams','$scope', '$rootScope', 'SettingService', 'api', settingController]);
  function settingController($state,$stateParams,$scope, $rootScope, SettingService, api) {
    $scope.GenoServerUrl = $rootScope.$settings.GenoServerUrl;
    $scope.alerts = [
      /*{ type: 'warning', msg: 'Oh snap! Change a few things up and try submitting again.' }}*/
    ];
    $scope.saveSettings = function () {

      SettingService.setSettings({
        GenoServerUrl: $scope.GenoServerUrl,
      }).then(function (result) {
        $scope.alerts.push({type: 'success', msg: '保存设置成功!'});
        $scope.$apply();
      })
    }
    $scope.backToPreState = function () {
      $state.go($stateParams.preState)
      //window.history.back();
    }
  };

})();