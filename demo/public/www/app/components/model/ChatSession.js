(function () {
  'use strict';
  angular.module('xyz.socket.chat.models')

  .factory('ChatSession', function ChatSession() {

    return function ChatSessionFactory(users, messages) {
      return {
        users: users || [],
        messages: messages || []
      };
    };
  });

})();
