/**
 * SettingController
 */
(function () {

  angular.module('Uploader.views').controller('SettingsController', ['$state','$stateParams','$scope', '$rootScope', 'SettingService', 'api', settingController]);
  function settingController($state,$stateParams,$scope, $rootScope, SettingService, api) {
    console.log('setting!!!!!!');
    $scope.GenoServerUrl = $rootScope.$settings.GenoServerUrl;
    $scope.alerts = [
      /*{ type: 'warning', msg: 'Oh snap! Change a few things up and try submitting again.' }}*/
    ];
    $scope.saveSettings = function () {

      SettingService.setSettings({
        GenoServerUrl: $scope.GenoServerUrl,
      }).then(function (result) {
        console.log(result);
        $scope.alerts.push({type: 'success', msg: '保存设置成功!'});
        $scope.$apply();
      })
    }
    $scope.backToPreState = function () {
      console.log('in setting page ---',$stateParams);
      $state.go($stateParams.preState)
    }
  };

})();