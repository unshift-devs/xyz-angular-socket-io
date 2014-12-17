(function () {
  'use strict';

  angular.module('xyz.socket.chat', [
    'ui.router',
    'xyz.socket',

    'xyz.socket.chat.env',
    'xyz.socket.chat.interactions',
    'xyz.socket.chat.services',
    'xyz.socket.chat.views',
    'xyz.socket.chat.config',
    'xyz.socket.chat.services.rest'
  ]).

  config(function ($stateProvider, $urlRouterProvider, $locationProvider,
    socketManagerProvider, socketUrl) {

    // configure socket connection
    socketManagerProvider.setSocketUrl(socketUrl);

    // Public routes
    $stateProvider
      .state('public', {
        abstract: true,
        template: '<ui-view/>'
      })
      .state('public.404', {
        url: '/404/',
        templateUrl: 'app/templates/unshift/404.tpl.html'
      });

    // Regular user routes
    $stateProvider
      .state('user', {
        abstract: true,
        template: '<ui-view/>'
      })
      .state('user.login', {
        url: '/',
        templateUrl: '/templates/unshift/views/login.tpl.html',
        controller: 'LoginCtrl',
        controllerAs: 'loginCtrl'
      })
      .state('user.home', {
        url: '/home',
        templateUrl: '/templates/unshift/views/home.tpl.html',
        controller: 'HomeCtrl',
        controllerAs: 'homeCtrl'
      });

    $urlRouterProvider.otherwise('/404');

    // FIX for trailing slashes.
    // based on https://github.com/angular-ui/ui-router/issues/50
    // and https://github.com/fnakstad/angular-client-side-auth/blob/master/client/js/app.js
    $urlRouterProvider.rule(function ($injector, $location) {
      if ($location.protocol() !== 'file') {

        var params = [];
        var path = $location.path();
        // Search returns a query object, not a search string
        var search = $location.search();

        // check to see if the path already ends in '/'
        if (path[path.length - 1] === '/') {
          return;
        }

        // If there was no search string / query params, return with a `/`
        if (Object.keys(search).length === 0) {
          return path + '/';
        }

        // Otherwise build the search string and return a `/?` prefix
        angular.forEach(search, function (v, k) {
          params.push(k + '=' + v);
        });
        return path + '/?' + params.join('&');
      }
      return;
    });

  });

})();
