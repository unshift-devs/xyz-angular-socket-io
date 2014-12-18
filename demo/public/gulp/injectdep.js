(function () {
  'use strict';

  var gulp = require('gulp');
  var gutil = require('gulp-util');
  var injectdep = require('gulp-inject');
  var bowerFiles = require('main-bower-files');
  var angularFilesort = require('gulp-angular-filesort');
  var order = require('gulp-order');
  var argv = require('yargs').argv;

  var paths = require('./path.json');

  // inject js
  gulp.task('inject:js', ['inject:init'], function () {

    return gulp.src(paths.indexSrc)
      .pipe(injectdep(
        gulp.src(paths.js, {
          read: true // true it's needed by angularFilesort()
        })
        .pipe(angularFilesort()), {
          ignorePath: paths.ignorePath,
          addRootSlash: paths.addRootSlash
        }))
      .pipe(gulp.dest(paths.dest));

  });

  // inject css
  gulp.task('inject:css', ['inject:js'], function () {

    return gulp.src(paths.indexSrc)
      .pipe(injectdep(
        gulp.src(paths.css, {
          read: false
        }), {
          ignorePath: paths.ignorePath,
          addRootSlash: paths.addRootSlash
        }))
      .pipe(gulp.dest(paths.dest));

  });

  // inject bower components
  gulp.task('inject:bower', ['inject:css'], function () {

    return gulp.src(paths.indexSrc)
      .pipe(
        injectdep(
          gulp.src(
            bowerFiles(), {
              read: false
            }
          )
          .pipe(order(paths.bowerOrder)), {
            ignorePath: paths.ignorePath,
            addRootSlash: paths.addRootSlash,
            starttag: '<!-- bower:{{ext}} -->'
          }
        )
      )
      .pipe(
        injectdep(
          gulp.src(
            paths.vendors, {
              read: false
            }
          ), {
            ignorePath: paths.ignorePath,
            addRootSlash: paths.addRootSlash,
            starttag: '<!-- vendor:{{ext}} -->'
          }
        )
      )
      .pipe(gulp.dest(paths.dest));

  });

  gulp.task('inject:init', function () {
    var fs = require('fs');
    var rename = require('gulp-rename');
    var gulpNgConfig = require('gulp-ng-config');

    var config;
    var configString;

    var configFile = 'local-config.json';
    if (argv.production) {
      configFile = 'production-config.json';
    }

    try {
      configString = fs.readFileSync(configFile);
      config = JSON.parse(configString);
    } catch (err) {
      gutil.log('There has been an error parsing your JSON. A default values will be created');
      config = {
        socketUrl: 'http://192.168.33.10:3000',
        restBaseUrl: 'http://192.168.33.10:3000'
      };
      configString = JSON.stringify(config);

      try {
        fs.writeFileSync(configFile, configString, 'utf8');
      } catch (err) {
        console.log('There has been an error saving your configuration data.');
        console.log(err.message);
        return;
      }
    }

    gulp.src(configFile)
      .pipe(gulpNgConfig('xyz.socket.chat.env'))
      .pipe(gulp.dest(paths.envFolder));

    return gulp.src(paths.template)
      .pipe(rename('index.html'))
      .pipe(gulp.dest(paths.dest));
  });

  gulp.task('inject', ['inject:bower']);

})();
