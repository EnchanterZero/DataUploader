/**
 * Created by intern07 on 16/7/25.
 */
var uploaderApp = angular.module('Uploader',[]);
/**
 * directives
 */
uploaderApp.directive("fileread", [function () {
  return {
    scope: {
      fileread: "="
    },
    link: function (scope, element, attributes) {
      element.bind("change", function (changeEvent) {
        scope.$apply(function () {
          scope.fileread = changeEvent.target.files[0];
          // or all selected files:
          // scope.fileread = changeEvent.target.files;
        });
      });
    }
  }
}]);
/**
 * constant configs
 */
var config_data = {
  'serverUrl': 'http://localhost:3000',
};

angular.forEach(config_data, function (value, key) {
  uploaderApp.constant(key, value);
});
