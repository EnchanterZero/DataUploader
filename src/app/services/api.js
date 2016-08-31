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
          $scope.alerts.push({ type: 'success', msg: 'Login success.Jumping into main page...' });
          $scope.$apply();
          $timeout(function () {
            //set ui
            $rScope.showLogout = true;
            DomChangeService.changeToUsingStyle();
            //jump to main page
            $state.go('upload');
          }, 1500);
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


      // this.login = function (query, $scope, $rScope) {
      //   return _BackendService.serverApi.authenticate(query.username, query.password)
      //   .then(function (result) {
      //     Session.set(LOCAL_BASE_TOKEN_KEY, result.data.token);
      //     Session.set(LOCAL_CURRENT_USER, result.data.currentUser);
      //     console.log('login success!!!!!!');
      //     $rScope.showLogout = true;
      //     var logoutLink = document.getElementById('logoutLink');
      //     angular.element(logoutLink).attr('style','display:block');
      //     $window.location.hash = '#/upload';
      //   })
      //   .catch(function (err) {
      //     console.log(err);
      //     $scope.errorMessage = err.message;
      //     $scope.$apply();
      //   });
      // };
      //
      // this.logout = function ($rScope) {
      //   return _BackendService.serverApi.deauthenticate()
      //   .then(() => {
      //     Session.set(LOCAL_BASE_TOKEN_KEY, null);
      //     Session.set(LOCAL_CURRENT_USER, null);
      //     console.log('logout success!!!!!!');
      //     $rScope.showLogout = false;
      //     var logoutLink = document.getElementById('logoutLink');
      //     angular.element(logoutLink).attr('style','display:none');
      //     $window.location.hash = '#/login';
      //   });
      // }
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
