(function () {
  'use strict';

  var _ = require('lodash');
  var model = require('./chatModel');

  function chatServer(server) {

    var io = require('socket.io').listen(server);
    var ioRoom = io.of('mean-io-test');
    var uidCounter = 0;

    ioRoom.on('connection', function (socket) {
      // console.log('Socket.io connected!');

      // user mapped to this section
      var currentUser;
      var currentRoom;

      function registerUserHandler(user, callback) {
        console.log('Logging user as: ' + user.username);

        if (_.isEmpty(user)) {
          if (callback) {
            callback('unknown user');
          }
          return;
        }

        if (model.users.hasOwnProperty(user.username)) {
          if (callback)  {
            callback('User already exist', user);
          }
          return;
        }

        currentUser = user;
        model.users[user.username] = user;

        if (callback) {
          callback(null, user);
        }
      }
      socket.on(model.socketEvents.listened.registerUser, registerUserHandler);

      function enterRoomHandler(roomUid, callback) {
        if (!model.rooms.hasOwnProperty(roomUid)) {
          if (callback) {
            callback('The room "' + roomUid + '" doesn\'t exists:');
          }
          return;
        }

        // leave old room
        if (currentRoom) {
          leaveRoomHandler(currentRoom);
        }

        console.log(currentUser.username + ' enter room: ' + model.rooms[roomUid].name);

        // join the room
        socket.join(roomUid);

        // store current room
        currentRoom = roomUid;

        // add user to room population
        if (!model.roomsPopulation.hasOwnProperty(currentRoom)) {
          model.roomsPopulation[currentRoom] = [];
        }
        model.roomsPopulation[currentRoom].push(currentUser);

        //emit to 'room' except this socket
        socket.broadcast.to(currentRoom).emit(model.socketEvents.emitted.enteredInRoom, currentUser);

        // send history and popoulation to client
        var roomStatus = {
          population: model.roomsPopulation[currentRoom],
          history: model.roomsHistory[currentRoom]
        };

        if (callback) {
          callback(null, roomStatus);
        }
      }
      socket.on(model.socketEvents.listened.enterRoom, enterRoomHandler);

      function leaveRoomHandler(roomUid, callback) {

        if (!model.rooms.hasOwnProperty(roomUid)) {
          if (callback) {
            callback('The room "' + roomUid + '" doesn\'t exists:');
          }
          return;
        }

        var room = model.rooms[roomUid];
        console.log(currentUser.username + ' left room: ' + room.name);

        if (currentRoom) {

          // remove user from room population
          var index = _.findIndex(model.roomsPopulation[currentRoom], {
            username: currentUser.username
          });
          model.roomsPopulation[currentRoom].splice(index, 1);

          //emit to 'room' except this socket
          var response = {
            user: currentUser,
            population: model.roomsPopulation[currentRoom]
          };
          socket.broadcast.to(currentRoom).emit(model.socketEvents.emitted.leftRoom, response);

          // leave room
          socket.leave(currentRoom);
        }

        if (callback) {
          callback(null, currentRoom ? model.roomsPopulation[currentRoom] : []);
        }

        if (currentRoom) {

          // don't try to remove the static rooms
          if (!_.contains(model.staticRooms, currentRoom)) {

            // if no more user are on the room, remove it
            if (model.roomsPopulation[currentRoom].length === 0) {

              var roomToLeave = currentRoom;
              setTimeout(function removeEmptyRooms() {
                console.log('testing to remove room ' + model.rooms[roomToLeave].name + ', numeber of users: ' + model.roomsPopulation[roomToLeave].length);
                if (model.roomsPopulation[roomToLeave].length === 0) {
                  delete model.roomsPopulation[roomToLeave];
                  delete model.roomsHistory[roomToLeave];
                  delete model.rooms[roomToLeave];
                  // send to all connected clients
                  ioRoom.emit(model.socketEvents.emitted.roomRemoved, roomToLeave);
                }
              }, 15000);

            }
          }
        }

        // clearcurrent room
        currentRoom = undefined;
      }
      socket.on(model.socketEvents.listened.leaveRoom, leaveRoomHandler);

      function postMessageHandler(message, callback) {
        console.log(currentUser.username + ' posted: ' + message.message);

        socket.broadcast.to(currentRoom).emit(model.socketEvents.emitted.messagePosted, message);
        if (callback) {
          callback(null, message);
        }

        // add filed to set as archived message
        message.archived = true;

        // store message in history
        model.roomsHistory[currentRoom].push(message);
        // keep history under 100 messages
        if (model.roomsHistory[currentRoom].length > 100) {
          model.roomsHistory[currentRoom].shift();
        }
      }
      socket.on(model.socketEvents.listened.postMessage, postMessageHandler);

      function addRoomHandler(roomName, callback) {
        console.log(currentUser.username + ' added room: ' + roomName);

        uidCounter++;
        var room = {
          name: roomName,
          uid: 'room' + uidCounter
        };
        model.rooms[room.uid] = room;
        model.roomsPopulation[room.uid] = [];
        model.roomsHistory[room.uid] = [];

        socket.broadcast.emit(model.socketEvents.emitted.roomAdded, room);

        if (callback) {
          callback(null, room);
        }
      }
      socket.on(model.socketEvents.listened.addRoom, addRoomHandler);

      function userDisconnectedHandler(message, callback) {
        if (!currentUser) {
          return;
        }

        console.log(currentUser.username + ' disconnected');

        if (currentRoom) {
          // notify disconnection
          leaveRoomHandler(currentRoom);
        }

        if (callback) {
          callback(null, true);
        }

        // remove user from users map
        delete model.users[currentUser.username];
        currentUser = undefined;
      }
      socket.on('disconnect', userDisconnectedHandler);

      function unregisterUserHandler(message, callback) {
        userDisconnectedHandler(message, callback);
      }
      socket.on(model.socketEvents.listened.unregisterUser, unregisterUserHandler);
    });

  }

  module.exports = chatServer;
})();
