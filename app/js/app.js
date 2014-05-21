'use strict';


// Angular Workplace module
var workplaceApp = angular.module('workplaceApp',
  ['ngRoute', 'workplaceControllers', 'workroomServices',
    'socketio.services',  'btford.socket-io',
    'ui.select2',
    'ngSanitize',
    'mpk.services', 'mpk.filters', 'mpk.directives', 'ui.bootstrap', 'ngSanitize', 'ui.utils' // for kanban
    /*, 'angularFileUpload' , 'angularjs-gravatardirective'*/]);

workplaceApp.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $routeProvider.
    when('/workrooms', {
        templateUrl: 'partials/workroom-list.html',
        controller: 'WorkroomCtrl'
      }).
    when('/workrooms/:workroomId/', {
      templateUrl: 'partials/workroom-detail.html',
      controller: 'WorkroomDetailCtrl'
    }).
    when('/workrooms/:workroomId/messages', {
      templateUrl: 'partials/workroom-detail.html',
      controller: 'WorkroomDetailCtrl'
    }).
    when('/workrooms/:workroomId/users', {
      templateUrl: 'partials/workroom-users.html',
      controller: 'WorkroomUsersCtrl'
    }).
    when('/workrooms/:workroomId/kanban', {
      templateUrl: 'partials/workroom-kanban.html',
      controller: 'KanbanAppCtrl'
    }).
    when('/profile/@:userName/', {
      templateUrl: 'partials/profile.html',
      controller: 'UserProfileCtrl'
    }).
    when('/user-settings/@:userName/', {
      templateUrl: 'partials/user-settings.html',
      controller: 'UserSettingsCtrl'
    }).
    otherwise({
      redirectTo: '/workrooms'
    })
    ;
    //$locationProvider.html5Mode(true);
  }]);
