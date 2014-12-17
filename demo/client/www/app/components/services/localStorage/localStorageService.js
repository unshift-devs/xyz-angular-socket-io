(function () {
  'use strict';

  angular.module('xyz.socket.chat.services.localStorage', [])

  // see http://learn.ionicframework.com/formulas/localstorage/
  .factory('localStorageService', function ($window) {
    return {
      set: function (key, value) {
        $window.localStorage[key] = value;
      },
      get: function (key, defaultValue) {
        return $window.localStorage[key] || defaultValue;
      },
      setObject: function (key, value) {
        $window.localStorage[key] = JSON.stringify(value);
      },
      getObject: function (key) {
        return JSON.parse($window.localStorage[key] || '{}');
      }
    };
  });

})();
