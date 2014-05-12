'use strict';

/* Workroom Services */
var workroomServices = angular.module('workroomServices', ['ngResource']);

workroomServices.factory('Workroom', ['$resource',
  function($resource) {
    return $resource('workrooms/:workroomId.json', {}, {
      query: {method:'GET', params:{workroomId:'workrooms'}, isArray:true}
    });
  }]);

/*
workroomServices.factory('WorkroomUsers', ['$resource',
  function($resource) {
    return $resource('workrooms/:workroomId-users.json', {}, {
      query: {method:'GET', params:{workroomId:'workrooms'}, isArray:true}
    });
  }]);
*/
