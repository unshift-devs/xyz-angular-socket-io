(function () {
  'use strict';

  angular.module('xyz.socket.chat.services.rest', [
    'xyz.socket.chat.models',
    'globals'
  ])

  .service('roomsListService', function roomsListService($http, _, restBaseUrl, dataModel) {
    var self = this;

    var endPoint = restBaseUrl + '/api/rooms';

    function resultHandler(data) {
      dataModel.rooms = {};
      dataModel.rooms._empty = {
        name: ''
      };
      _.extend(dataModel.rooms, data.data);
    }

    function errorHandler(data) {
      dataModel.rooms = {};
      // TODO manage error message
      console.error(data.statusText + ' CODE: ' + data.status);
    }

    self.execute = function execute() {
      return $http.get(endPoint).then(resultHandler).catch(errorHandler);
    };

  });

})();
