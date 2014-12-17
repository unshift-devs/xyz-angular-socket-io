(function () {
  'use strict';

  var gulp = require('gulp');
  var $ = require('gulp-load-plugins')();
  var del = require('del');

  gulp.task('clean', function clean(cb) {
    del([
      'dist/**'
    ], cb);
  });

  gulp.task('minify', ['clean'], function buildTast() {

    gulp.src(['lib/*.js'])

    .pipe($.stripDebug())

    .pipe($.ngAnnotate({
      remove: false,
      add: true,
      single_quotes: true,
      stats: true
    }))

    .pipe($.order([
      '**/*index.js',
      '**/*SocketWrapper.js',
      '**/*socketManager.js'
    ]))

    .pipe($.concat('xyz.socket.min.js'))

    .pipe($.uglify({
      mangle: true
    }))

    .pipe(gulp.dest('dist'))

    .pipe($.rename('xyz.socket.js'))

    .pipe(gulp.dest('demo/client/www/lib'));
  });

  gulp.task('default', ['minify']);
})();
