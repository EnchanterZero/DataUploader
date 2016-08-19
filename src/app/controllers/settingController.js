/**
 * SettingController
 */
(function () {

  angular.module('Uploader.views').controller('SettingsController', ['$scope', '$rootScope', 'SettingService', 'api', settingController]);
  function settingController($scope, $rootScope, SettingService, api) {
    console.log('setting!!!!!!');
    $scope.PACSProvider = $rootScope.$settings.PACSProvider;
    $scope.PACSServerIP = $rootScope.$settings.PACSServerIP;
    $scope.PACSServerPort = $rootScope.$settings.PACSServerPort;
    $scope.ScanInterval = $rootScope.$settings.ScanInterval;
    $scope.UserValidateURL = $rootScope.$settings.UserValidateURL;
    $scope.AnonymousMode = $rootScope.$settings.AnonymousMode;

    $scope.AnonymousModeCheck = $scope.AnonymousMode == 1 ? true : false;
    $scope.message = '';
    $scope.saveSettings = function () {

      SettingService.setSettings({
        PACSProvider: $scope.PACSProvider,
        PACSServerIP: $scope.PACSServerIP,
        PACSServerPort: $scope.PACSServerPort,
        ScanInterval: $scope.ScanInterval,
        UserValidateURL: $scope.UserValidateURL,
        AnonymousMode: $scope.AnonymousModeCheck ? 1 : 0,
      }).then(function (result) {
        $scope.message = '已保存设置';
      })
    }
  };

})();