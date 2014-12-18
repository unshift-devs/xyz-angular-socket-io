(function () {
  'use strict';

  var model = require('./chatModel');

  module.exports.rooms = function rooms(req, res) {
    res.json(model.rooms);
  };

  module.exports.roomPopulation = function roomPopulation(req, res) {
    if (!model.roomsPopulation.hasOwnProperty(req.roomId)) {
      res.status(404).send('The room "' + req.roomId + '"" doesn\'t exist!');
    } else {
      res.json(model.roomsPopulation[req.roomId]);
    }
  };

  module.exports.catchAll = function catchAll(req, res) {
    res.sendfile('index.html', {
      root: __dirname + '/public'
    });
  };

})();
