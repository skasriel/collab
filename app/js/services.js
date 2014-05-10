'use strict';

/* Services */
var workroomServices = angular.module('workroomServices', ['ngResource']);

workroomServices.factory('Workroom', ['$resource',
  function($resource) {
    return $resource('workrooms/:workroomId.json', {}, {
      query: {method:'GET', params:{workroomId:'workrooms'}, isArray:true}
    });
  }]);
