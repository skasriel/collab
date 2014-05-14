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


/* Socket.io services */
angular.module('socketio.services', []).
  factory('socket', function (socketFactory) {
    return socketFactory();
  }).
  value('version', '0.1');


/*
app.factory('socket', function ($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});*/
