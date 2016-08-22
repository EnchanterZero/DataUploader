/**
 * service api
 */
(function () {
  var logger = require('../../dist/util').util.logger.getLogger('serviceApi');

  angular.module('Uploader.services')
  .service('api', ['$http', '$rootScope', 'serverUrl', 'Session', '$window', function ($http, $rootScope, serverUrl, Session, $window) {
    var LOCAL_BASE_TOKEN_KEY = 'baseToken';
    var LOCAL_CURRENT_USER = 'currentUser';
    var api = this;

    /**
     * auth api
     */
    this.login = function (query, $scope) {
      return _BackendService.serverApi.authenticate(query.username, query.password)
      .then(function (result) {
        Session.set(LOCAL_BASE_TOKEN_KEY, result.data.token);
        Session.set(LOCAL_CURRENT_USER, result.data.currentUser);
        console.log('login success!!!!!!');
        $window.location.hash = '#/upload';
      })
      .catch(function (err) {
        console.log(err);
        $scope.errorMessage = err.message;
      });
    };

    this.logout = function () {
      return _BackendService.serverApi.deauthenticate()
      .then(() => {
        Session.set(LOCAL_BASE_TOKEN_KEY, null);
        Session.set(LOCAL_CURRENT_USER, null);
        console.log('logout success!!!!!!');
        $window.location.hash = '#/login';
      });
    }
    this.setUserToken = function () {
      var token = Session.get(LOCAL_BASE_TOKEN_KEY);
      return co(function*() {
        if (token) {
          _BackendService.serverApi.setBaseAuthToken(token);
        }
        return {}
      })
    }

    /**
     * manual upload api
     */
    this.getFileInfoList = function () {
      return _FileInfo.listFiles()
      .then(function (r) {
        return { fileInfoList: r }
      })
    }

    this.uploadFile = function (data) {
      var project = data.project;
      var path = data.fileList[0];
      var syncId = new Date().getTime().toString();
      co(function*() {
        let r = yield _BackendService.fileUpload.uploadFiles(project, data.fileList, syncId, { afterDelete: false });
      }).catch((err) => {
        console.error(err, err.stack);
      });
      return co(function*() {
        return { syncId: syncId }
      });

    }

    this.stopUploadFile = function (syncId) {
      return _BackendService.fileUpload.stopUploadFiles(syncId)
      .then((r)=> {
        return { result: r }
      });
    }

    this.resumeUploadFile = function (syncId) {
      co(function*() {
        let r = yield _BackendService.fileUpload.uploadFiles(null, [], syncId, { afterDelete: false });
      })
      .catch((err) => {
        logger.error(err, err.stack);
      });
      return co(function*() {
        return {}
      })
    }

    this.abortUploadFile = function (syncId) {
      co(function*() {
        yield _BackendService.fileUpload.abortUploadFiles(syncId);
      })
      .catch((err) => {
        logger.error(err, err.stack);
      });
      return co(function*() {
        return {}
      })
    }
    
    this.getProjects = function () {
      return _BackendService.serverApi.getGenoProjects()
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
        yield _Config.setConfig(settingsJSON);
        _BackendService.uploadSetting.setConfig(settingsJSON);
        return settingsJSON
      }).catch(err => {
        logger.error(err, err.stack);
      });
    }

    this.getSettings = function () {
      return _Config.getConfig()
      .then(function (r) {
        return { settings: r }
      })
    }

  }]);

})();
