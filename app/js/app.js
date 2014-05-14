'use strict';


// Angular Workplace module
var workplaceApp = angular.module('workplaceApp', ['ngRoute', 'workplaceControllers', 'workroomServices', 'socketio.services',  'btford.socket-io', 'ui.select2'])
  .config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $routeProvider.
    when('/workrooms', {
        templateUrl: 'partials/workroom-list.html',
        controller: 'WorkroomCtrl'
      }).
    when('/workrooms/:workroomId', {
      templateUrl: 'partials/workroom-detail.html',
      controller: 'WorkroomDetailCtrl'
    }).
    when('/workrooms/:workroomId/users', {
      templateUrl: 'partials/workroom-users.html',
      controller: 'WorkroomUsersCtrl'
    }).
    otherwise({
      redirectTo: '/workrooms'
    });
    //$locationProvider.html5Mode(true);
  }]);
