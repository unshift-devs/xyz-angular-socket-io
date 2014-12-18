(function () {
  'use strict';

  angular.module('xyz.socket.chat.views')

  .controller('HomeCtrl', function HomeCtrl($scope, $state, _, socketManager, roomsListService,
    dataModel, ChatSession, socketEvents) {

    var self = this;

    function goToLogin() {
      $state.go('user.login');
    }

    if (_.isEmpty(dataModel.user)) {
      // redirect to login
      goToLogin();
    }

    self.socket = socketManager.getSocket('/mean-io-test');

    if (!dataModel.userRegistered) {

      self.socket.emit(socketEvents.toServer.registerUser, dataModel.user,
        function userRegistered(error) {
          if (error) {
            // manage error
            console.error(error);

            // clear datamodel for user
            dataModel.user = null;

            // go to login
            goToLogin();
            return;
          }

          // force user registration status
          dataModel.setUserAsRegistered(true);
        });
    }

    self.dataModel = dataModel;
    self.session = new ChatSession();

    self.nextMessage = '';

    self.showCreateRoomPanel = false;

    // load rooms list
    roomsListService.execute();

    self.toggleAddRoomControls = function toggleAddRoomControls(status) {
      self.showCreateRoomPanel = status;
      self.newRoom = null;
    };

    function roomAdded(error, room) {
      dataModel.rooms[room.uid] = room;

      // auto-join the room
      self.changeRoom(room);
    }
    self.addRoom = function addRoom(roomName) {
        self.socket.emit(socketEvents.toServer.addRoom, roomName, roomAdded);
        self.toggleAddRoomControls(false);
    };

    function roomChanged(error, roomInfo) {
      self.session = new ChatSession(roomInfo.population, roomInfo.history);
    }

    self.changeRoom = function changeRoom(room) {
      if (self.activeRoom && self.activeRoom.uid === room.uid) {
        return;
      }

      if (room.name === '') {
        if (self.activeRoom) {
          self.leaveRoom();
        }
        return;
      }

      // required beacuse angular material tab trigger changeRoom() after the $destroy event
      if (self.socket) {
        self.activeRoom = room;
        self.socket.emit(socketEvents.toServer.enterRoom, room.uid, roomChanged);
      }
    };

    function roomLeft(error, onlineUsers) {
      self.session = undefined;
      self.activeRoom = undefined;
    }
    self.leaveRoom = function leaveRoom() {
      self.socket.emit(socketEvents.toServer.leaveRoom, self.activeRoom.uid, roomLeft);
    };

    function messageSent(error, message) {
      self.session.messages.push(message);
    }
    self.sendMessage = function sendMessage() {
      if (_.isEmpty(self.nextMessage)) {
        return;
      }
      var msg = {
        type: 'msg',
        author: dataModel.user,
        timestamp: new Date().getTime(),
        message: self.nextMessage
      };

      self.socket.emit(socketEvents.toServer.postMessage, msg, messageSent);
      self.nextMessage = '';
    };

    function userLoggedOut(error, message) {
      // reset user model
      dataModel.user = null;

      // navigate to login
      goToLogin();
    }
    self.logout = function logout() {
      self.socket.emit(socketEvents.toServer.unregisterUser, dataModel.user, userLoggedOut);
    };

    // ------------------------
    // ------------------------
    // ------------------------

    function disconnectedHandler() {
      // force user registration status
      dataModel.setUserAsRegistered(false);
      goToLogin();
    }
    self.socket.addEventListener('disconnect', disconnectedHandler);

    function roomAddedHandler(room) {
      dataModel.rooms[room.uid] = room;
    }
    self.socket.addEventListener(socketEvents.fromServer.roomAdded, roomAddedHandler);

    function roomRemovedHandler(roomUID) {
      if (dataModel.rooms.hasOwnProperty(roomUID)) {
        delete dataModel.rooms[roomUID];
      }
    }
    self.socket.addEventListener(socketEvents.fromServer.roomRemoved, roomRemovedHandler);

    function messagePostedHandler(message) {
      self.session.messages.push(message);
    }
    self.socket.addEventListener('messagePosted', messagePostedHandler);

    function userEnteredHandler(user) {
      self.session.users.push(user);

      var msg = {
        type: 'enter-action',
        author: user,
        timestamp: new Date().getTime(),
        message: user.username + ' joined the room'
      };
      self.session.messages.push(msg);
    }
    self.socket.addEventListener(socketEvents.fromServer.enteredInRoom, userEnteredHandler);

    function userLeftHandler(response) {
      // response.user
      // response.population
      self.session.users = response.population;

      var msg = {
        type: 'leave-action',
        author: response.user,
        timestamp: new Date().getTime(),
        message: response.user.username + ' left the room'
      };
      self.session.messages.push(msg);
    }
    self.socket.addEventListener(socketEvents.fromServer.leftRoom, userLeftHandler);

    $scope.$on('$destroy', function destroyHandler() {
      socketManager.destroySocket(self.socket);
      self.socket = null;
    });

  });

})();
