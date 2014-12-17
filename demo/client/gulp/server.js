'use strict';

var gulp = require('gulp');

gulp.task('connect:src', function () {
  var connect = require('connect');

  var app = connect()
    .use(connect.static('www'));

  gulp.server = require('http').createServer(app)
    .listen(9000)
    .on('listening', function () {
      console.log('Started connect web server on http://localhost:9000');
    });
});

gulp.task('connect:dist', function () {
  var connect = require('connect');

  var app = connect()
    .use(connect.static('dist'));

  gulp.server = require('http').createServer(app)
    .listen(9000)
    .on('listening', function () {
      console.log('Started connect web server on http://localhost:9000');
    });
});

gulp.task('serve', ['connect:src'], function () {
  require('opn')('http://localhost:9000');
});
