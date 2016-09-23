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
          //$scope.alerts = [];
          //$scope.alerts.push({ type: 'success', msg: '登陆成功.正在跳转到主页面...' });
          $scope.$apply();
          $timeout(function () {
            //set ui
            $rScope.showLogout = true;
            DomChangeService.changeToMainStyle();
            //jump to main page
            $state.go('upload');
          }, 1000);
        })
        .catch(function (err) {
          logger.debug(err);
          $scope.alerts = [];
          if(err.message == 'authenticate failed') err.message = '错误的用户名或密码.';
          $scope.alerts.push({ type: 'warning', msg: '登录失败,原因: ' + err.message });
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

      this.recoverIfUnfinished = function ($scope) {
        var currentUser = _BackendService.serverApi.getBaseUser();
        if (!currentUser) {
          $state.go('login');
          return;
        }
        return co(function*() {
          let r = yield _FileInfo.listFiles(currentUser.id);
          var uploadingCount = 0;
          r.map(function(item){
            if(item.status ==_FileInfo.FileInfoStatuses.pausing ||item.status == _FileInfo.FileInfoStatuses.uploading)
              uploadingCount++;
          });
          if (uploadingCount > 0) {
            const { dialog } = require('electron').remote;
            var buttonIndex = dialog.showMessageBox({
              type: 'info',
              buttons: ['确认'],
              title: '恢复上传',
              message: '已经恢复上次未完成的上传'
            }, function () {
            });
            $scope.uploading = true;
            $scope.stopCount = 5;
          }
          _BackendService.uploadRecovery.recover(r);
          return r;
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
        //return _FileInfo.listFiles(currentUser.id)
        return Promise.resolve(_FileInfo.getUnfinishedFileList(currentUser.id))
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

      this.getAllUploadRecords = function () {
        return this.getProjects().then(function (projects) {
          if(projects.length > 0){
            return _BackendService.serverApi.getAllRecords(projects[0].id);
          }else{
            logger.error('no projects!');
            return Promise.resolve([]);
          }
        })
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

      /**
       * download api
       */
      this.getDownloadUrl = function (data) {
        return _BackendService.serverApi.getDownloadUrl(data)
        .then(function (r) {
          return r;
        })
      }

    }]);

})();
