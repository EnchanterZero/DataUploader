/**
 * service AuthService
 */
(function () {

  angular.module('Uploader.services')
  .service('AuthService', ['$rootScope', '$state', '$window', 'api', 'Session', authService]);

  function authService($rootScope, $state, $window, api, Session) {
    var LOCAL_TOKEN_KEY = 'token';
    var LOCAL_CURRENT_USER = 'currentUser';

    var authService = this;

    $rootScope.$on('invalidTokenEvent', function () {
      authService.gotoLogin();
    });

    this.gotoLogin = function () {
      this.useCredentials(null, null);
      var currentState = $state.current.name;
      $window.location.href = './auth.html';
    }

    this.loadCredentials = function () {
      var token = Session.get(LOCAL_TOKEN_KEY);
      var currentUser = Session.get(LOCAL_CURRENT_USER);
      this.useCredentials(token, currentUser);
      return token;
    }

    this.useCredentials = function (token, currentUser) {
      this.token = token;
      this.currentUser = currentUser;
      $rootScope.$isAuthenticated = !!token;
      api.setAuthToken(token);
    }

    this.isAuthenticated = function () {
      return !!this.token;
    };

    this.getCurrentUser = function () {
      return this.currentUser;
    }

    this.logout = function () {
      this.gotoLogin();
    }

    return authService;
  }
})();

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

/**
 * service Session
 */
(function () {

  angular.module('Uploader.services')
  .service('Session', [function () {
    var SESSION_STORE_NAME = 'session_store';

    var session = this;

    function load() {
      try {
        session.store = JSON.parse(window.localStorage.getItem(SESSION_STORE_NAME));
      } catch (e) {
      }
      if (!session.store) {
        session.store = {};
      }
    }

    load();

    this.save = function () {
      window.localStorage.setItem(SESSION_STORE_NAME, JSON.stringify(this.store));
    }

    this.set = function (key, val) {
      this.store[key] = val;
      this.save();
    };

    this.get = function (key, val) {
      return this.store[key];
    };
  }])

})();

/**
 * service api
 */
(function () {

  var backendService = require('../../dist/services');
  var FileInfo = require('../../dist/modules/fileinfo');
  var Config = require('../../dist/modules/config');
  var co = require('co');
  var logger = require('../../dist/util').util.logger.getLogger('serviceApi');
  //check upload
  co(function* () {
    let r = yield FileInfo.listUploadingFiles()
    backendService.uploadRecovery.recover(r);
  })

  angular.module('Uploader.services')
  .service('api', ['$http', '$rootScope', 'serverUrl', 'Session', '$window', function ($http, $rootScope, serverUrl, Session, $window) {
    var LOCAL_TOKEN_KEY = 'token';
    var LOCAL_CURRENT_USER = 'currentUser';
    var api = this;

    this.setAuthToken = function (token) {
      this.token = token;
    }

    /**
     * auth api
     */
    this.login = function (query, $scope) {
      return backendService.serverApi.authenticate(query.username, query.password)
      .then(function (result) {
        if (result.code !== 200) {
          throw new Error(result.data.message);
          return;
        }
        if (!result.data.token || !result.data.currentUser) {
          throw new Error('empty response');
          return;
        }
        Session.set(LOCAL_TOKEN_KEY, result.data.token);
        Session.set(LOCAL_CURRENT_USER, result.data.currentUser);
        api.setAuthToken(result.data.token);
        console.log('login success!!!!!!');
        $window.location.href = './index.html';
      })
      .catch(function (err) {
        $scope.errorMessage = err.message;
      });
    };

    this.logout = function () {
      return backendService.serverApi.deauthenticate()
      .then(() => {
        Session.set(LOCAL_TOKEN_KEY, null);
        Session.set(LOCAL_CURRENT_USER, null);
        api.setAuthToken(null);
        console.log('logout success!!!!!!');
        $window.location.href = './auth.html';
      });
    }
    this.setUserToken = function (data) {
      var token = Session.get(LOCAL_TOKEN_KEY);
      return co(function* () {
        if (token)
          backendService.serverApi.setAuthToken(token);
        return {}
      })
    }

    /**
     * manual upload api
     */
    this.getFileInfoList = function () {
      return FileInfo.listFiles()
      .then(function (r) {
        return { fileInfoList: r }
      })
    }

    this.uploadFile = function (path) {
      var syncId = new Date().getTime().toString();
      co(function*() {
        let r = yield backendService.fileUpload.uploadFiles([path], syncId, { afterDelete: false });
      }).catch((err) => {
        console.error(err, err.stack);
      });
      return co(function*() {
        return { syncId: syncId }
      });

    }

    this.stopUploadFile = function (syncId) {
      return backendService.fileUpload.stopUploadFiles(syncId)
      .then((r)=> {
        return { result: r }
      });
    }

    this.resumeUploadFile = function (syncId) {
      co(function*() {
        let r = yield backendService.fileUpload.uploadFiles([], syncId, { afterDelete: false });
      })
      .catch((err) => {
        logger.error(err, err.stack);
      });
      return co(function* () {
        return {}
      })
    }

    /**
     * settings api
     */

    this.setSettings = function (data) {
      var settings = data.settings;
      var settingsJSON = {
        PACSProvider: settings.PACSProvider,
        PACSServerIP: settings.PACSServerIP,
        PACSServerPort: settings.PACSServerPort,
        ScanInterval: settings.ScanInterval,
        UserValidateURL: settings.UserValidateURL,
        AnonymousMode: settings.AnonymousMode,
      };
      return co(function*() {
        yield Config.setConfig(settingsJSON);
        backendService.uploadSetting.setConfig(settingsJSON);
        return settingsJSON
      }).catch(err => {
        logger.error(err, err.stack);
      });
    }

    this.getSettings = function () {
      return Config.getConfig()
      .then(function (r) {
        return { settings: r }
      })
    }

  }]);

})();