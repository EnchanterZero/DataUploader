/**
 * HistoryController
 */
(function () {

  angular.module('Uploader.views').controller('HistoryController', ['$scope', 'api', '$interval', '$state', historyController]);
  function historyController($scope, api, $interval, $state) {
    //logger.debug('$rootScope.historyControllerScope --> $scope');
    $scope.fileList = [];
    // var i = 0;
    // do {
    //   i++;
    //   $scope.fileList.push({
    //     "id": "2ed9dac7-1c44-42d5-a919-0cbea4eff659" + i,
    //     "name": "abc" + i,
    //     "objectKey": "projects/a33ced47-6b64-467f-9550-5615d61c141d",
    //     "reference": 1,
    //     "size": i,
    //     "public": false,
    //     "uploadRegion": "oss-cn-qingdao",
    //     "uploadBucket": "curacloud-geno-test",
    //     "uploadPercent": i,
    //     "uploadCheckpoint": null,
    //     "finished": true,
    //     "deleted": false,
    //     "createdAt": "2016-09-12T08:31:54.000Z",
    //     "updatedAt": "2016-09-12T08:31:54.000Z"
    //   });
    // } while ($scope.fileList.length < 500);
    $scope.pageCount = 8;
    $scope.displayedPages = 9;
    api.getAllUploadRecords()
    .then(function (fileList) {
      
      $scope.fileList = fileList.map(function (item) {
        return item.source; 
        //$scope.fileList.push(item.source);
      });
      //console.log($scope.fileList);
      utils.formatList($scope.fileList, $scope.fileList);
      $scope.$digest();
    })


    $scope.backToMain = function(){
      $state.go('upload');
    }
    $scope.download = function(fileId){
    }
  }

  /**
   *
   */

})();