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
      return api.setSettings({settings: settingsJSON})
      .then(function (result) {
        $rootScope.$settings = settingsJSON;
        return result;
      })
    }

    return settingService;
  }
})();

/**
 * service StateService
 */
(function () {

  angular.module('Uploader.services')
  .service('PageStateService', ['$rootScope', '$state', '$window', 'api', 'Session', pageStateService]);

  function pageStateService($rootScope, $state, $window, api, Session) {
    var LOCAL_PACSProvider = 'PACSProvider';
    var LOCAL_PACSServerIP = 'PACSServerIP';
    var LOCAL_PACSServerPort = 'PACSServerPort';
    var LOCAL_ScanInterval = 'ScanInterval';
    var LOCAL_UserValidateURL = 'UserValidateURL';
    var LOCAL_AnonymousMode = 'AnonymousMode';

    var pageStateService = this;

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
      return api.setSettings({settings: settingsJSON})
      .then(function (result) {
        $rootScope.$settings = settingsJSON;
        return result;
      })
    }

    return pageStateService;
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

  angular.module('Uploader.services')
  .service('api', ['$http', '$rootScope', 'serverUrl', 'Session', '$window', function ($http, $rootScope, serverUrl, Session, $window) {
    var LOCAL_TOKEN_KEY = 'token';
    var LOCAL_CURRENT_USER = 'currentUser';
    var api = this;

    function authorize(options) {
      var token = Session.get(LOCAL_TOKEN_KEY);
      var credential = { token: token };
      if (options.method === 'GET') {
        options.params = _.assign(options.params, credential);
      } else {
        options.data = _.assign(options.data, credential);
      }
    }

    function checkStatusCode(result) {
      if (!result || !result.data) {
        throw new Error('empty response');
      }
      if (result.data.code === 1001) {
        $rootScope.$emit('invalidTokenEvent');
        api.token = null;
      }
      if (result.data.code !== 200) {
        throw new Error('code ' + result.data.code);
      }
      //log all response data
      console.log(result.data.data);
      return result.data.data;
    }

    this.setAuthToken = function (token) {
      this.token = token;
    }

    this.testCreateFile = function () {
      var option = {
        method: 'POST',
        url: 'http://localhost:3000' + '/file/create',
        data: {
          type: 'uploadDcm',
          size: '0',
          hash: 'NONE',
          name: 'test!!!!!!!!!!!!!!!',
          isZip: false
        },
      }
      authorize(option);
      console.log(option);
      return $http(option)
      .then(checkStatusCode)
    }

    /**
     * auth api
     */
    this.login = function (query, $scope) {
      var options = {
        method: 'POST',
        url: serverUrl + '/auth/login',
        data: query,
      };
      return $http(options)
      .then(function (result) {
        if (result.data.code !== 200) {
          throw new Error(result.data.message);
          return;
        }
        if (!result.data.data.token || !result.data.data.currentUser) {
          throw new Error('empty response');
          return;
        }
        Session.set(LOCAL_TOKEN_KEY, result.data.data.token);
        Session.set(LOCAL_CURRENT_USER, result.data.data.currentUser);
        api.setAuthToken(result.data.data.token);
        console.log('login success!!!!!!');
        $window.location.href = './index.html';
      })
      .catch(function (err) {
        $scope.errorMessage = err.message;
      });
    };

    this.logout = function () {
      var options = {
        method: 'POST',
        url: serverUrl + '/auth/logout',
      }
      authorize(options)
      return $http(options)
      .then(checkStatusCode)
      .then(() => {
        Session.set(LOCAL_TOKEN_KEY, null);
        Session.set(LOCAL_CURRENT_USER, null);
        api.setAuthToken(null);
        console.log('logout success!!!!!!');
        $window.location.href = './auth.html';
      });
    }

    /**
     * manual upload api
     */
    this.readDcm = function (data) {
      var options = {
        method: 'POST',
        url: serverUrl + '/manualUpload/read',
        data: data,
      }
      authorize(options)
      return $http(options)
      .then(checkStatusCode);
    }

    this.uploadFile = function (query) {
      var option = {
        method: 'POST',
        url: serverUrl + '/manualUpload/start',
        data: query,
      }
      authorize(option);
      return $http(option)
      .then(checkStatusCode)
    }

    /**
     * auto scan api
     */
    this.startScan = function (query) {
      var option1 = {
        method: 'POST',
        url: serverUrl + '/autoscanUpload/start',
        data: query,
      }
      authorize(option1)
      return $http(option1)
      .then(checkStatusCode)
    }

    this.endScan = function (query) {
      var option = {
        method: 'POST',
        url: serverUrl + '/autoscanUpload/stop',
        data: query,
      }
      authorize(option)
      return $http(option)
      .then(checkStatusCode)
    }

    /**
     * upload status api
     */
    this.getUploadStatus = function (query) {
      var option = {
        method: 'GET',
        url: serverUrl + '/uploadStatus/one/' + query,
        data: {},
      }
      authorize(option);
      return $http(option)
      .then(checkStatusCode)
    }

    this.getAllUploadStatus = function (query) {
      var option = {
        method: 'GET',
        url: serverUrl + '/uploadStatus',
        data: {},
      }
      authorize(option);
      return $http(option)
      .then(checkStatusCode)
    }

    this.getInitStauts = function (query) {
      var option = {
        method: 'GET',
        url: serverUrl + '/uploadStatus/check',
        data: {},
      }
      authorize(option);
      return $http(option)
      .then(checkStatusCode)
    }

    /**
     * upload history api
     */
    this.listUpload = function (query) {
      var option = {
        method: 'GET',
        url: serverUrl + '/history/list/' + query.count + '/' + query.page,
        data: query,
      };
      authorize(option);
      return $http(option)
      .then(checkStatusCode)
    }

    /**
     * auto push api
     */
    this.startListen = function (query) {
      var option = {
        method: 'POST',
        url: serverUrl + '/autoPush/start',
        data: query,
      };
      authorize(option);
      return $http(option)
      .then(checkStatusCode)
    }

    this.stopListen = function (query) {
      var option = {
        method: 'POST',
        url: serverUrl + '/autoPush/stop',
        data: query,
      };
      authorize(option);
      return $http(option)
      .then(checkStatusCode)
    }

    /**
     * settings api
     */

    this.setSettings = function (data) {
      var option = {
        method: 'POST',
        url: serverUrl + '/settings/set',
        data: data,
      };
      authorize(option);
      return $http(option)
      .then(checkStatusCode)
    }

    this.getSettings = function () {
      var option = {
        method: 'GET',
        url: serverUrl + '/settings',
        data: {},
      };
      authorize(option);
      return $http(option)
      .then(checkStatusCode)
    }

  }]);

})();