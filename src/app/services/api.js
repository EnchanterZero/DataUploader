/**
 * service api
 */
(function () {
  var logger = require('../../dist/util').util.logger.getLogger('serviceApi');

  angular.module('Uploader.services')
  .service('api', ['$http', '$rootScope', 'serverUrl', 'Session', '$timeout', 'DomChangeService', '$state', 'AuthService',
    function ($http, $rootScope, serverUrl, Session, $timeout, DomChangeService, $state, AuthService) {
      var LOCAL_BASE_TOKEN_KEY = 'baseToken';
      var LOCAL_CURRENT_USER = 'currentUser';
      var api = this;

      /**
       * auth api
       */
      this.login = function (query, $scope, $rScope) {
        return _BackendService.serverApi.authenticate(query.username, query.password)
        .then(function (result) {
          Session.set(LOCAL_BASE_TOKEN_KEY, result.data.token);
          Session.set(LOCAL_CURRENT_USER, result.data.currentUser);
          AuthService.loadCredentials();
          logger.debug('login success!!!!!!');
          //restore username and password
          var s = {
            username: query.username,
            password: query.password,
            rememberPassword: $scope.rememberPassword ? '1' : '0',
            autoLogin: $scope.autoLogin ? '1' : '0',
          }
          api.setSettings({settings:s}).then(function (result) {
            $rootScope.$settings = result;
          })
          $scope.alerts.push({ type: 'success', msg: 'Login success.Jumping into main page...' });
          $scope.$apply();
          $timeout(function () {
            //set ui
            $rScope.showLogout = true;
            DomChangeService.changeToUsingStyle();
            //jump to main page
            $state.go('upload');
          }, 1000);
        })
        .catch(function (err) {
          logger.debug(err);
          $scope.alerts.push({ type: 'warning', msg: 'Login failed for ' + err.message });
          $scope.loginButton = '登录';
          $scope.$apply();
        });
      };

      this.logout = function ($rScope) {
        return _BackendService.serverApi.deauthenticate()
        .then(() => {
          Session.set(LOCAL_BASE_TOKEN_KEY, null);
          Session.set(LOCAL_CURRENT_USER, null);
          AuthService.loadCredentials();
          logger.debug('logout success!!!!!!');
          $rScope.showLogout = false;
          DomChangeService.changeToLoginStyle();
          //$window.location.hash = '#/login';
          $state.go('login');
          //$rScope.$apply();
        }).catch(function (err) {
          logger.debug(err.message, err.stack);
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

      this.recoverIfUnfinished = function () {
        var currentUser = _BackendService.serverApi.getBaseUser();
        if (!currentUser) {
          $state.go('login');
          return;
        }
        co(function*() {
          let r = yield _FileInfo.listUploadingFiles(currentUser.id);
          if (r.length > 0) {
            const { dialog } = require('electron').remote;
            var buttonIndex = dialog.showMessageBox({
              type: 'info',
              buttons: ['确认'],
              title: '恢复上传',
              message: '已经恢复上次未完成的上传'
            }, function () {
            })
            _BackendService.uploadRecovery.recover(r);
          }
        });
      }
      this.stopAll = function () {
        return _BackendService.fileUpload.stopAllUploading()
      }

      /**
       * manual upload api
       */
      this.getFileInfoList = function () {
        var currentUser = _BackendService.serverApi.getBaseUser();
        if (!currentUser) {
          $state.go('login');
          return Promise.reject('no currentUser');
        }
        return _FileInfo.listFiles(currentUser.id)
        .then(function (r) {
          return { fileInfoList: r }
        })
      }

      this.uploadFile = function (data) {
        var project = data.project;
        var fileList = data.fileList;
        var syncId = new Date().getTime().toString();
        co(function*() {
          let r = yield _BackendService.fileUpload.uploadFiles(project, fileList, syncId, { afterDelete: false });
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
        return co(function*() {
          let r = yield _BackendService.fileUpload.uploadFiles(null, [], syncId, { afterDelete: false });
          return r;
        })
        .catch((err) => {
          logger.error(err, err.stack);
          throw err;
        });
      }

      this.abortUploadFile = function (syncId) {
        return co(function*() {
          let result = yield _BackendService.fileUpload.abortUploadFiles(syncId);
          return result;
        })
        .catch((err) => {
          logger.error(err, err.stack);
        });
      }

      this.getProjects = function () {
        return _BackendService.serverApi.getGenoProjects()
      }

      /**
       * settings api
       */

      this.setSettings = function (data) {
        var settings = data.settings;
        return co(function*() {
          yield result = _BackendService.uploadSetting.setConfig(settings);
          return result;
        }).catch(err => {
          logger.error(err, err.stack);
        });
      }

      this.getSettings = function () {
        return _BackendService.uploadSetting.getConfig()
        .then(function (r) {
          return { settings: r }
        })
      }

    }]);

})();
