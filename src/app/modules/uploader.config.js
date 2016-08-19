/**
 * Uploader.config
 */
(function () {
  'use strict';

  var app = angular.module('Uploader.config', []);

  var config_data = {
    'serverUrl': "http://" + window.location.host,
  };

  angular.forEach(config_data, function (value, key) {
    app.constant(key, value);
  });

})();