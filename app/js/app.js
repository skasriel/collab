'use strict';


// Declare app level module which depends on filters, and services
var workplaceApp = angular.module('workplaceApp', [
  'ngRoute',
  'workplaceControllers',
  'workroomServices'
]);

workplaceApp.config(['$routeProvider',
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
      otherwise({
        redirectTo: '/workrooms'
      });
  }]);
