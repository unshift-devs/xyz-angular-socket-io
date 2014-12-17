(function () {
  'use strict';
  angular.module('xyz.socket.chat.models')

  .service('dataModel', function dataModel(_, localStorageService) {
    var self = this;

    self.rooms = [];

    var userRegistered = false;

    Object.defineProperty(self, 'userRegistered', {
      enumerable: true,
      configurable: false,
      get: function getUserRegistered() {
        return userRegistered;
      }
    });

    var user;
    var userKey = 'xyz-chat-user';
    Object.defineProperty(self, 'user', {
      enumerable: true,
      configurable: false,
      get: function getUser() {
        if (!user) {
          user = localStorageService.getObject(userKey);
        }
        return user;
      },
      set: function setUser(value) {
        user = value;
        localStorageService.setObject(userKey, user);
        userRegistered = !_.isEmpty(value);
      }
    });

    self.setUserAsRegistered = function setUserAsRegistered() {
      userRegistered = true;
    };

  });

})();
