/**
 * UploaderController
 */
  angular.module('Uploader').controller('UploadController',['$scope',uploaderController]);
  function uploaderController($scope) {
    $scope.dir = '';
    $scope.upload = function(){
      console.log($scope.dir);
    }
  };

/**
 * UploaderController
 */
  'use strict';
  angular.module('Uploader').controller('AutoScanController',['$scope',autoScanController]);
  function autoScanController($scope) {

  };

/**
 * UploaderController
 */
  angular.module('Uploader').controller('SettingController',['$scope',settingController]);
  function settingController($scope) {

  };