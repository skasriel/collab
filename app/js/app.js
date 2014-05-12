'use strict';


// Angular Workplace module
var workplaceApp = angular.module('workplaceApp', ['ngRoute', 'workplaceControllers', 'workroomServices'])
  .config(['$routeProvider',
  function($routeProvider) {
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
  }]);
