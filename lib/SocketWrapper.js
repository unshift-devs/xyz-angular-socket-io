(function () {
  'use strict';
  // socketService

  angular.module('xyz.socket')

  .factory('SocketWrapper', function SocketWrapper($window, $timeout) {

    function asyncAngularify(context, callback) {
      return callback ? function () {
        var args = arguments;
        $timeout(function executeInAngular() {
          callback.apply(context, args);
        }, 0);
      } : angular.noop;
    }

    return function socketWrapper(socket, options) {

      if (!socket && (!_.isString(options.source) && !(socket instanceof $window.io.Socket))) {
        throw new Error('Impossible initialize a socketWrapper without a valid socket instance or a socket URL');
      }

      if (_.isString(options.source)) {
        socket = $window.io.connect(options.source);
      }

      // ---------------------------------------------
      // WRAPPER API
      // ---------------------------------------------

      function addListener(eventName, callback) {
        socket.on(eventName, callback.__ref = asyncAngularify(socket, callback));
      }

      function addOnceListener(eventName, callback) {
        socket.once(eventName, callback.__ref = asyncAngularify(socket, callback));
      }

      function removeListener(ev, fn) {
        if (fn && fn.__ref) {
          arguments[1] = fn.__ref;
        }
        return socket.removeListener.apply(socket, arguments);
      }

      function disconnect() {
        return socket.disconnect();
      }

      function emit(eventName, data, callback) {
        var lastIndex = arguments.length - 1;
        var callbackRef = arguments[lastIndex];

        if (_.isFunction(callbackRef)) {
          callbackRef = asyncAngularify(socket, callbackRef);
          arguments[lastIndex] = callbackRef;
        }

        return socket.emit.apply(socket, arguments);
      }

      function removeAllListeners() {
        return socket.removeAllListeners.apply(socket, arguments);
      }

      function connect() {
        return socket.connect();
      }

      // ---------------------------------------------
      // ADDITIONAL API
      // ---------------------------------------------

      function destroy() {
        removeAllListeners();
        disconnect();
        socket = undefined;
      }

      // ---------------------------------------------
      // EVENT LISTENERS
      // ---------------------------------------------

      addListener('connect', function onConnect() {
        console.log('connected');
        wrappedSocket.connected = socket.connected;
        wrappedSocket.connecting = false;
        wrappedSocket.error = false;
      });
      addListener('connecting', function onConnecting() {
        console.log('connecting');
        wrappedSocket.connecting = true;
      });
      addListener('disconnect', function onDisconnect() {
        wrappedSocket.connected = socket.connected;
        wrappedSocket.connecting = false;
        wrappedSocket.error = false;
      });
      addListener('reconnect', function onConnect() {
        wrappedSocket.connected = socket.connected;
        wrappedSocket.connecting = false;
        wrappedSocket.error = false;
      });
      addListener('reconnecting', function onReconnecting() {
        wrappedSocket.connecting = true;
      });
      addListener('error', function onError() {
        wrappedSocket.error = true;
        wrappedSocket.connecting = false;
      });
      addListener('connect_failed', function onConnectionFailed() {
        wrappedSocket.error = true;
        wrappedSocket.connecting = false;
      });

      // ---------------------------------------------
      // EXPOSED API OBJECT
      // ---------------------------------------------

      var wrappedSocket = {
        /* socket reference*/
        socket: socket,

        /* socket API*/
        on: addListener,
        addListener: addListener,
        addEventListener: addListener,
        once: addOnceListener,
        emit: emit,
        removeListener: removeListener,
        removeEventListener: removeListener,
        removeAllListeners: removeAllListeners,
        disconnect: disconnect,
        close: disconnect,
        connect: connect,

        /* exposed statuses */
        connected: false,
        connecting: false,
        error: false,

        /* additional API */
        destroy: destroy
      };

      return wrappedSocket;
    };
  });

})();
