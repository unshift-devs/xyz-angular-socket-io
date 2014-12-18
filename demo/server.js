(function () {
  'use strict';

  var express = require('express');
  var path = require('path');
  var logger = require('morgan');
  var methodOverride = require('method-override');
  var session = require('express-session');
  var bodyParser = require('body-parser');
  var multer = require('multer');
  var errorHandler = require('errorhandler');
  var cors = require('cors');

  var routes = require('./api/routes');

  var app = express();

  // ------------
  // ------------ Setup server
  // ------------

  // all environments
  app.set('port', process.env.PORT || 8080);
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
  app.use(express.static(path.join(__dirname, 'public/www')));

  // ------------
  // ------------ REST ROUTES
  // ------------

  app.get('/api/rooms', routes.rooms);

  app.get('/api/population/:roomId', routes.roomPopulation);

  // serve index.html for all other routes
  app.all('/api/*', routes.catchAll);

  // ------------
  // ------------ start express server
  // ------------

  // error handling middleware should be loaded after the loading the routes
  if ('development' === app.get('env')) {
    // app.use(errorHandler());
  }

  var server = app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
  });

  // ------------
  // ------------ start socket server
  // ------------

  var chatServer = require('./api/chatServer')(server);

})();
