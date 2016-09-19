/**
 * UploaderController
 */
(function () {

  angular.module('Uploader.views').controller('UploadController', ['$rootScope', 'api', '$interval', '$uibModal', uploadController]);
  function uploadController($rootScope, api, $interval, $uibModal) {
    logger.debug('$rootScope.uploadControllerScope --> $scope');
    var getFileUplodStatuses = function ($scope) {
      $scope.intervalId = $interval(function () {
        if($scope.uploading) {
          getFileList($scope);
        }
      }, 1000);
    };

    var getFileList = function ($scope) {
      return api.getFileInfoList().then(
        function (result) {
          if (result.fileInfoList) {
            var activeItems =[];
            result.fileInfoList.map(function (item) {
              if(item.status != 'finished')
                activeItems.push(item);
            })
            //logger.debug(activeItems);
            if(activeItems.length == 0){
              $scope.stopCount--;
              if(!$scope.stopCount) $scope.uploading = false;
            }else{
              $scope.stopCount = 5;
            }
            if (!$scope.fileInfoList) {
              utils.formatList(result.fileInfoList, result.fileInfoList);
              $scope.fileInfoList = result.fileInfoList;
            } else {
              utils.formatList(result.fileInfoList, $scope.fileInfoList);
              //$scope.oldfileInfoList = angular.copy($scope.fileInfoList);
              utils.minAssignList($scope.fileInfoList, result.fileInfoList);
            }
            utils.viewChinesefiy($scope.fileInfoList);
          }
        }
      );
    }

    if (!$rootScope.uploadControllerScope) {
      const { dialog } = require('electron').remote;
      //check for recover only once
      console.log('check for recover only once')
      $rootScope.uploadControllerScope = {};
      var $scope = $rootScope.uploadControllerScope;
      api.recoverIfUnfinished($scope);
      if (!$rootScope.$settings) {
        api.getSettings()
        .then(function (result) {
          $rootScope.$settings = result.settings;
          $scope.dcmDir = $rootScope.$settings.UploadDir;
        })
      } else {
        $scope.dcmDir = $rootScope.$settings.UploadDir;
      }
      $scope.fileInfoList;
      $scope.stopCount = 5;
      $scope.uploading = false;
      $scope.chosenFileList = [];
      getFileList($scope);
      getFileUplodStatuses($scope);

      $scope.browseAndUpload = function () {
        var path = dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] });
        if (path) {
          var fileSection = true;
          var files = [];
          try {
            path.map(function (p) {
              var stat = require('fs').statSync(p);
              if (!stat.isFile()) {
                throw p + ' is not a file';
              }else{
                files.push({filePath: p, size: stat.size});
              }
            })
          }catch(err) {
            fileSection = false;
          }
          if (fileSection) {
            $scope.chosenFileList = [];
            files.map(function (file) {
              $scope.chosenFileList.push({
                filePath: file.filePath,
                size: file.size
              });
            })
            
            $scope.message = '';
            //openUploadModal();

            //hide the project chooser and use the first project,then upload
            api.getProjects().then(function (list) {
              logger.debug('got project:', list);
              if (list[0]) {
                $scope.uploading = true;
                return api.uploadFile({
                  project: list[0],
                  fileList: $scope.chosenFileList,
                })
              } else {
                dialog.showMessageBox({
                  type: 'error',
                  buttons: ['确认'],
                  title: 'error',
                  message: '您没有上传的权限'
                }, function () {
                })
              }
            })
            .catch(function (err) {
              logger.debug(err);
              if(typeof err == 'string'){
                var msg = err;
                err = {};
                err.message = '无法上传:' + msg;
              }
              else if (err.message.indexOf('ENOTFOUND') > 0 || err.message.indexOf('ENOENT') > 0) {
                err.message = '无法连接至网络,请检查网络连接后重试';
              }
              dialog.showMessageBox({
                type: 'error',
                buttons: ['确认'],
                title: 'error',
                message: '上传失败,原因:' + err.message,
              }, function () {
              })
            })

          } else {
            $scope.message = '文件选择错误!请重新选择';
          }
        }
      }
      var openUploadModal = function (size) {
        var modalInstance = $uibModal.open({
          animation: true,
          templateUrl: './views/dashboard/uploadmodal.html',
          controller: 'UploadModalController',
          size: size,
          resolve: {
            fileList: function () {
              return $scope.chosenFileList;
            }
          }
        });

        modalInstance.result.then(function (selectedProject) {
          return api.uploadFile({
            project: selectedProject,
            fileList: $scope.chosenFileList,
          })
        }, function () {
          console.log('Modal dismissed at: ' + new Date());
        });
      }
      $scope.browseFolder = function (path) {
        $scope.dcmDir = dialog.showOpenDialog({ properties: ['openFile'] });
      };
      $scope.pauseUpload = function (sId) {
        $scope.fileInfoList.map(function (o) {
          if (o.syncId == sId) {
            o.working = true;
            o.workingStatus = 'pausing...';
            o.statusLocalized = '暂停中';
          }
        });
        api.stopUploadFile(sId).then(function () {
        });
      };
      $scope.resumeUpload = function (sId) {
        $scope.fileInfoList.map(function (o) {
          if (o.syncId == sId) {
            o.working = true;
            o.workingStatus = 'resuming...';
            o.statusLocalized = '恢复中';
            if (o.status == 'failed') {
              o.failedCount = 0;
            }
          }
        });
        $scope.uploading = true;
        $scope.stopCount = 5;
        api.resumeUploadFile(sId).then(function () {
        })
        .catch(function (err) {
          dialog.showMessageBox({ type: 'error', buttons: ['确认'], title: 'error', message: '上传失败,请稍后重试' }, function () {
          })
        })
      };
      $scope.abortUpload = function (sId) {
        var buttonIndex = dialog.showMessageBox({
          type: 'question',
          buttons: ['确认', '取消'],
          title: '取消上传',
          message: '确认取消该文件的上传吗?'
        })
        if (buttonIndex == 0) {
          $scope.fileInfoList.map(function (o) {
            if (o.syncId == sId) {
              o.working = true;
              o.workingStatus = 'aborting...';
              o.statusLocalized = '放弃中';
            }
          });
          api.abortUploadFile(sId).then(function (result) {
            logger.debug(result);
            if (!result.success) {
              dialog.showMessageBox({
                type: 'error',
                buttons: ['确认'],
                title: 'error',
                message: '取消上传失败,请检查网络连接'
              }, function () {
              })
            }
          });
        }

      };

    } else if ($rootScope.uploadControllerScope && $rootScope.uploadControllerScope.intervalId) {
      var $scope = $rootScope.uploadControllerScope;
      getFileUplodStatuses($scope);
      console.log('$interval continue : ', $rootScope.uploadControllerScope.intervalId);
    }
  }

  /**
   *
   */

  angular.module('Uploader.views').controller('UploadModalController', ['$scope', 'api', '$uibModalInstance', 'fileList', uploadModalController]);
  function uploadModalController($scope, api, $uibModalInstance, fileList) {
    var totalSize = _.reduce(fileList, function (sum, f) {
      return sum + f.size;
    }, 0);
    $scope.totalSize = utils.getFormatSizeString(totalSize);
    $scope.fileList = fileList;
    api.getProjects().then(function (list) {
      $scope.projectList = list;
      $scope.selectedProject = $scope.projectList[0];
    })

    $scope.ok = function () {
      $uibModalInstance.close($scope.selectedProject);
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  }
})();