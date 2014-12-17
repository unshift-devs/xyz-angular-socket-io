(function () {
  'use strict';

  angular.module('xyz.socket.chat.views')

  .controller('LoginCtrl', function LoginCtrl($scope, _, socketEvents, socketManager, dataModel, $state) {
    var self = this;

    self.socket = socketManager.getSocket('/mean-io-test');

    self.username = '';

    var tmpUser = {
      username: null
    };

    function userRegistered(error, message) {
      if (error) {
        // manage error
        return;
      }

      // store user
      dataModel.user = tmpUser;

      // navigate to dashboard
      $state.go('user.home');
    }

    self.register = function register() {
      if (_.isEmpty(self.username)) {
        return;
      }
      tmpUser.username = self.username;

      self.socket.emit(socketEvents.toServer.registerUser, tmpUser, userRegistered);
    };

    function connectedHandler() {
      if (!_.isEmpty(dataModel.user)) {
        // navigate to dashboard
        $state.go('user.home');
      }
    }
    self.socket.addEventListener('connect', connectedHandler);

  });

})();
