(function () {
  'use strict';

  angular.module('xyz.socket.chat.interactions.keyboard', [])

  .directive('xyzEnterPressed', function () {
    return function (scope, element, attrs) {

      function bindKeyPress(event) {
        if (event.which === 13) {
          scope.$apply(function () {
            scope.$eval(attrs.xyzEnterPressed);
          });
          event.preventDefault();
        }
      }

      element.bind('keydown keypress', bindKeyPress);

      scope.$on('$destroy', function () {
        element.unbind('keydown keypress', bindKeyPress);
      });
    };
  });
})();
