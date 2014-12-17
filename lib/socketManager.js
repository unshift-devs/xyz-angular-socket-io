(function () {
  'use strict';
  // socketService

  angular.module('xyz.socket')

  .provider('socketManager', function socketManager() {
    var SOCKET_URL;

    return {

      setSocketUrl: function setSocketUrl(url) {
        SOCKET_URL = url;
      },

      $get: ['SocketWrapper', function socketManagerGetFactory(SocketWrapper) {
        var self = this;

        if (angular.isUndefined(SOCKET_URL)) {
          throw new Error('`socketManager` require to be configurated with a default socket url');
        }

        var socketMap = {};

        function composeSocketUrl(namespace) {
          var root = SOCKET_URL;
          if (root.lastIndexOf('/') === root.length - 1) {
            root = root.substring(0, root.length - 1);
          }

          if (namespace.indexOf('/') !== 0) {
            namespace = '/' + namespace;
          }
          return root + namespace;
        }

        function getSocket(namespace, overwrite) {
          if (socketExist(namespace) && !overwrite) {
            return socketMap[namespace];
          }
          var options = {
            source: composeSocketUrl(namespace),
            reconnectionAttempts: 10
          };
          socketMap[namespace] = new SocketWrapper(null, options);
          return socketMap[namespace];
        }

        function socketExist(namespace) {
          return socketMap.hasOwnProperty(namespace);
        }

        function destroySocket(namespace) {
          if (socketExist(namespace)) {
            var socket = getSocket(namespace);
            delete socketMap[namespace];
            // destroy the socket wrapper instance
            socket.destroy();
          }
        }

        function destroyAllSockets() {
          angular.forEach(socketMap, function destroySocketIterator(socket, namespace) {
            destroySocket(namespace);
          }, self);
        }

        return {
          get socketUrl() {
            return SOCKET_URL;
          },
          socketExist: socketExist,
          getSocket: getSocket,
          destroySocket: destroySocket,
          destroyAllSockets: destroyAllSockets
        };
      }]
    };

  });

})();
