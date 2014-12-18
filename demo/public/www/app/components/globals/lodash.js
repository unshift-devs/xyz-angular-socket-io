(function () {
  'use strict';
  angular.module('globals.lodash', [])

  .factory('_', function lodash($window) {
    return $window._;
  });
})();
