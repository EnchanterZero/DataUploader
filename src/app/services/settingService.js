/**
 * service SettingService
 */
(function () {

  angular.module('Uploader.services')
  .service('SettingService', ['$rootScope', '$state', '$window', 'api', 'Session', settingService]);

  function settingService($rootScope, $state, $window, api, Session) {

    var LOCAL_GenoServerUrl = 'GenoServerUrl';

    var settingService = this;

    this.loadSettings = function () {
      return api.getSettings()
      .then(function (result) {
        $rootScope.$settings = result.settings;
        return result.settings;
      })
    }

    this.setSettings = function (settings) {
      var settingsJSON = {
        GenoServerUrl: settings.GenoServerUrl,
      };
      return api.setSettings({ settings: settingsJSON })
      .then(function (result) {
        $rootScope.$settings = result;
        return result;
      })
    }

    return settingService;
  }
})();