module.exports = (function () {
  'use strict';

  var rooms = {
    hall: {
      uid: 'hall',
      name: 'Hall'
    },
    chitChat: {
      uid: 'chitChat',
      name: 'Chit chat'
    },
    geeks: {
      uid: 'geeks',
      name: 'Geeks'
    }
  };

  var staticRooms = [
    rooms.hall.uid,
    rooms.chitChat.uid,
    rooms.geeks.uid
  ];

  var users = {};

  var roomsPopulation = {
    hall: [],
    chitChat: [],
    geeks: []
  };

  var roomsHistory = {
    hall: [],
    chitChat: [],
    geeks: []
  };

  var socketEvents = {
    listened: {
      postMessage: 'postMessage',
      registerUser: 'registerUser',
      unregisterUser: 'unregisterUser',
      enterRoom: 'enterRoom',
      leaveRoom: 'leaveRoom',
      addRoom: 'addRoom'
    },
    emitted: {
      messagePosted: 'messagePosted',
      userRegistered: 'userRegistered',
      enteredInRoom: 'enteredInRoom',
      leftRoom: 'leftRoom',
      roomAdded: 'roomAdded',
      roomRemoved: 'roomRemoved'
    }
  };

  return {
    rooms: rooms,
    staticRooms: staticRooms,
    users: users,
    roomsPopulation: roomsPopulation,
    roomsHistory: roomsHistory,
    socketEvents: socketEvents
  };

})();
