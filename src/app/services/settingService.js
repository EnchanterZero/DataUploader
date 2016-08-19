/**
 * service SettingService
 */
(function () {

  angular.module('Uploader.services')
  .service('SettingService', ['$rootScope', '$state', '$window', 'api', 'Session', settingService]);

  function settingService($rootScope, $state, $window, api, Session) {

    var LOCAL_PACSProvider = 'PACSProvider';
    var LOCAL_PACSServerIP = 'PACSServerIP';
    var LOCAL_PACSServerPort = 'PACSServerPort';
    var LOCAL_ScanInterval = 'ScanInterval';
    var LOCAL_UserValidateURL = 'UserValidateURL';
    var LOCAL_AnonymousMode = 'AnonymousMode';

    var settingService = this;

    this.loadSettings = function () {
      api.getSettings()
      .then(function (result) {
        $rootScope.$settings = result.settings;
      })
    }

    this.setSettings = function (settings) {
      var settingsJSON = {
        PACSProvider: settings.PACSProvider,
        PACSServerIP: settings.PACSServerIP,
        PACSServerPort: settings.PACSServerPort,
        ScanInterval: settings.ScanInterval,
        UserValidateURL: settings.UserValidateURL,
        AnonymousMode: settings.AnonymousMode,
      };
      return api.setSettings({ settings: settingsJSON })
      .then(function (result) {
        $rootScope.$settings = settingsJSON;
        return result;
      })
    }

    return settingService;
  }
})();