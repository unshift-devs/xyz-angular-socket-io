(function () {
  'use strict';

  var _ = require('lodash');

  var express = require('express');

  var path = require('path');

  var logger = require('morgan');
  var methodOverride = require('method-override');
  var session = require('express-session');
  var bodyParser = require('body-parser');
  var multer = require('multer');
  var errorHandler = require('errorhandler');

  var cors = require('cors');
  var mongoose = require('mongoose');

  var app = express();

  // ------------
  // ------------ Setup server
  // ------------

  // all environments
  app.set('port', process.env.PORT || 3000);
  app.use(cors());
  app.use(logger('dev'));
  app.use(methodOverride());
  app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'uwotm8'
  }));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(multer());
  app.use(express.static(path.join(__dirname, 'public')));

  // ------------
  // ------------ ROOMS and USERS data
  // ------------

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
  var staticRooms = [rooms.hall.uid, rooms.chitChat.uid, rooms.geeks.uid];

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

  // ------------
  // ------------ REST ROUTES
  // ------------

  app.get('/rooms', function (req, res) {
    res.json(rooms);
  });

  app.get('/population/:roomId', function (req, res) {
    if (!roomsPopulation.hasOwnProperty(req.roomId)) {
      res.status(404).send('The room "' + req.roomId + '"" doesn\'t exist!');
    } else {
      res.json(roomsPopulation[req.roomId]);
    }
  });

  // serve index.html for all other routes
  app.all('/*', function (req, res, next) {
    res.sendfile('index.html', {
      root: __dirname + '/public'
    });
  });

  // ------------
  // ------------ start server
  // ------------

  // error handling middleware should be loaded after the loading the routes
  if ('development' === app.get('env')) {
    // app.use(errorHandler());
  }

  var server = app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
  });

  // ------------
  // ------------ SOCKET
  // ------------

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

      if (users.hasOwnProperty(user.username)) {
        if (callback)  {
          callback('User already exist', user);
        }
        return;
      }

      currentUser = user;
      users[user.username] = user;

      if (callback) {
        callback(null, user);
      }
    }
    socket.on(socketEvents.listened.registerUser, registerUserHandler);

    function enterRoomHandler(roomUid, callback) {
      console.log(currentUser.username + ' enter room: ' + roomUid);

      if (!rooms.hasOwnProperty(roomUid)) {
        if (callback) {
          callback('The room "' + roomUid + '" doesn\'t exists:');
        }
        return;
      }

      // leave old room
      if (currentRoom) {
        socket.leave(currentRoom);
      }

      // join the room
      socket.join(roomUid);

      // store current room
      currentRoom = roomUid;

      // add user to room population
      if (!roomsPopulation.hasOwnProperty(currentRoom)) {
        roomsPopulation[currentRoom] = [];
      }
      roomsPopulation[currentRoom].push(currentUser);

      //emit to 'room' except this socket
      socket.broadcast.to(currentRoom).emit(socketEvents.emitted.enteredInRoom, currentUser);

      // send history and popoulation to client
      var roomStatus = {
        population: roomsPopulation[currentRoom],
        history: roomsHistory[currentRoom]
      };

      if (callback) {
        callback(null, roomStatus);
      }
    }
    socket.on(socketEvents.listened.enterRoom, enterRoomHandler);

    function leaveRoomHandler(roomUid, callback) {

      if (!rooms.hasOwnProperty(roomUid)) {
        if (callback) {
          callback('The room "' + roomUid + '" doesn\'t exists:');
        }
        return;
      }

      var room = rooms[roomUid];
      console.log(currentUser.username + ' left room: ' + room.name);

      if (currentRoom) {

        // remove user from room population
        var index = _.findIndex(roomsPopulation[currentRoom], {
          username: currentUser.username
        });
        roomsPopulation[currentRoom].splice(index, 1);

        //emit to 'room' except this socket
        var response = {
          user: currentUser,
          population: roomsPopulation[currentRoom]
        };
        socket.broadcast.to(currentRoom).emit(socketEvents.emitted.leftRoom, response);

        // leave room
        socket.leave(currentRoom);
      }

      if (callback) {
        callback(null, currentRoom ? roomsPopulation[currentRoom] : []);
      }

      if (currentRoom) {
        // if no more user are on the room, remove it
        if (roomsPopulation[currentRoom].length === 0) {
          if (!_.contains(staticRooms, currentRoom)) {
            delete roomsPopulation[currentRoom];
            delete roomsHistory[currentRoom];
            delete rooms[currentRoom];
            // send to all connected clients
            ioRoom.emit(socketEvents.emitted.roomRemoved, currentRoom);
          }
        }
      }

      // clearcurrent room
      currentRoom = undefined;
    }
    socket.on(socketEvents.listened.leaveRoom, leaveRoomHandler);

    function postMessageHandler(message, callback) {
      console.log(currentUser.username + ' posted: ' + message.message);

      socket.broadcast.to(currentRoom).emit(socketEvents.emitted.messagePosted, message);
      if (callback) {
        callback(null, message);
      }

      // add filed to set as archived message
      message.archived = true;

      // store message in history
      roomsHistory[currentRoom].push(message);
      // keep history under 100 messages
      if (roomsHistory[currentRoom].length > 100) {
        roomsHistory[currentRoom].shift();
      }
    }
    socket.on(socketEvents.listened.postMessage, postMessageHandler);

    function addRoomHandler(roomName, callback) {
      console.log(currentUser.username + ' added room: ' + roomName);

      uidCounter++;
      var room = {
        name: roomName,
        uid: 'room' + uidCounter
      };
      rooms[room.uid] = room;
      roomsPopulation[room.uid] = [];
      roomsHistory[room.uid] = [];

      socket.broadcast.emit(socketEvents.emitted.roomAdded, room);

      if (callback) {
        callback(null, room);
      }
    }
    socket.on(socketEvents.listened.addRoom, addRoomHandler);

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
      delete users[currentUser.username];
      currentUser = undefined;
    }
    socket.on('disconnect', userDisconnectedHandler);

    function unregisterUserHandler(message, callback) {
      userDisconnectedHandler(message, callback);
    }
    socket.on(socketEvents.listened.unregisterUser, unregisterUserHandler);
  });

  // ------------
  // ------------ MONGOOSE
  // ------------

  /* mongoose.connect('mongodb://localhost/unnotedb');
   var db = mongoose.connection;
   db.on('error', console.error.bind(console, 'connection error:'));
   db.once('open', function mongooseConnected() {
     console.info('Mongoose Connected!');
   });*/

})();
