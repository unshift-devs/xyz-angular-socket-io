(function () {
  'use strict';

  angular.module('xyz.socket.chat.config', [])

  .constant('socketEvents', {
    toServer: {
      postMessage: 'postMessage',
      registerUser: 'registerUser',
      unregisterUser: 'unregisterUser',
      enterRoom: 'enterRoom',
      leaveRoom: 'leaveRoom',
      addRoom: 'addRoom'
    },
    fromServer: {
      messagePosted: 'messagePosted',
      userRegistered: 'userRegistered',
      enteredInRoom: 'enteredInRoom',
      leftRoom: 'leftRoom',
      roomAdded: 'roomAdded',
      roomRemoved: 'roomRemoved'
    }
  });

})();
