/**
 * UploaderController
 */
(function () {

  angular.module('Uploader.views').controller('UploadController', ['$rootScope', 'api', '$interval', '$uibModal', uploadController]);
  function uploadController($rootScope, api, $interval, $uibModal) {
    logger.debug('$rootScope.uploadControllerScope --> $scope');
    var getFileUplodStatuses = function ($scope) {
      $scope.intervalId = $interval(function () {
        getFileList($scope);
      }, 1000);
    };
    
    var getFileList = function ($scope) {
      return api.getFileInfoList().then(
        function (result) {
          if (result.fileInfoList) {
             if (!$scope.fileInfoList) {
               utils.formatList(result.fileInfoList, result.fileInfoList);
               $scope.fileInfoList = result.fileInfoList;
             } else {
              utils.formatList(result.fileInfoList, $scope.fileInfoList);
              //$scope.oldfileInfoList = angular.copy($scope.fileInfoList);
              utils.minAssignList($scope.fileInfoList, result.fileInfoList)
            }
          }
        }
      );
    }
    
    if (!$rootScope.uploadControllerScope) {
      const { dialog } = require('electron').remote;
      //check for recover only once
      console.log('check for recover only once')
      api.recoverIfUnfinished();
      $rootScope.uploadControllerScope = {};
      var $scope = $rootScope.uploadControllerScope;
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
      $scope.chosenFileList = [];
      getFileList($scope);
      getFileUplodStatuses($scope);
    
      $scope.browseAndUpload = function () {
        var path = dialog.showOpenDialog({ properties: ['openFile', /*'openDirectory', 'multiSelections',*/] });
        if (path) {
          $scope.dcmDir = path[0];
          var stat = require('fs').statSync(path[0]);
          if (stat.isFile()) {
            $scope.chosenFileList = [];
            $scope.chosenFileList.push({
              filePath: path[0],
              size: stat.size
            });
            $scope.message = '';
            //openUploadModal();
            
            //hide the project chooser and use the first project,then upload
            api.getProjects().then(function (list) {
              return api.uploadFile({
                project: list[0],
                fileList: $scope.chosenFileList,
              })
            })
            
          } else {
            $scope.message = '文件选择错误!请重新选择';
            $scope.dcmDir = '';
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
          }
        });
        api.resumeUploadFile(sId).then(function () {
        });
      };
      $scope.abortUpload = function (sId) {
        var buttonIndex = dialog.showMessageBox({type:'question',buttons:['确认','取消'],title:'取消上传',message:'确认取消该文件的上传吗?'})
        if(buttonIndex == 0){
          $scope.fileInfoList.map(function (o) {
            if (o.syncId == sId) {
              o.working = true;
              o.workingStatus = 'aborting...';
            }
          });
          api.abortUploadFile(sId).then(function () {
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