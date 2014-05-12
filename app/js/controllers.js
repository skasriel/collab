'use strict';

/* AngularJS Workplace Controllers */

var workroomControllers = angular.module('workplaceControllers', []);

workroomControllers.controller('CurrentUserCtrl', ['$scope', '$http',
  function ($scope, $http) {
    console.log('getting active user');
    $http.get('/api/active_user').success(function(data) {
      $scope.active_user = data;
      console.log(' active user: '+data);
    });
  }]);

// Get list of all workrooms for logged in user
workroomControllers.controller('WorkroomCtrl', ['$scope', '$http', '$window' /*, 'Workroom'*/,
  function ($scope, $http, $window) {
    //$scope.workrooms = Workroom.query();
    console.log('getting workroom list');
    $http.get('/api/workrooms').success(function(data) {
      $scope.workrooms = data;
      console.log(' workroom list: '+$scope.workrooms);
    })
    .error(function(data, status) {
      console.log("Workroom list error: "+status+" "+data.error);
      /*if (status == 401 || status==500) {
        alert("error... google");
        $window.location.href = 'http://www.google/com'; ///app/register.html';
        $window.location.reload();
      }*/
    })
  }]);



// Get list of messages for a room
workroomControllers.controller('WorkroomDetailCtrl', ['$scope', '$routeParams', '$http', 'Workroom',
  function($scope, $routeParams, $http, Workroom) {
    var url = '/api/workrooms/' + $routeParams.workroomId + "/messages";
    $http.get(url).success(function(data) {
      console.log("messages data: "+data[0].name+" "+data.length);
      $scope.workroomName = data.shift().name; // first entry is room name
      $scope.messages = data;
      console.log("room name is: "+$scope.workroomName);
    });
    $scope.workroomId = $routeParams.workroomId;
    $scope.$parent.workroomId = $routeParams.workroomId; // to allow highlighting in left nav
  }]);

// Add a message to a workroom
workroomControllers.controller('AddMessageController', ['$scope', '$routeParams', '$http',
    function($scope, $routeParams, $http) {
      $scope.PostMessage = function() {
          var url = '/api/workrooms/'+$routeParams.workroomId+'/messages';
          console.log("post to: "+url);
          $http.post(url, {'html': $scope.message})
          .success(function(data, status, headers, config) {
            $scope.messages.push(data);
            $scope.message='';
            console.log("Post message result: "+status+" - "+data.msg);
            console.log("Post message error: "+data.error);
          }).error(function(data, status) {
            console.log("Post message error: "+status+" "+data.error);
          });
      }
    }]);

// create a new work room
workroomControllers.controller('AddWorkroomController', ['$scope', '$routeParams', '$http',
  function($scope, $routeParams, $http) {
      $scope.CreateWorkroom = function() {
          var url = '/api/workrooms/';
          console.log("post to: "+url);
          $http.post(url,
            {'name': $scope.workroomName,
              'user': 'skasriel'}
          ).success(function(data, status, headers, config) {
            console.log("Post message result: "+status+" - "+data+" "+$scope.$parent.workrooms+" err="+data.error);
            $scope.$parent.workrooms.push(data); // refresh list of workrooms to reflect new room
            $('#AddWorkroomModal').modal('hide'); // close modal dialog
          }).error(function(data, status) {
            console.log("Post message error: "+status+" "+data.error);
          });
      }
    }]);




// Get list of users in a room
workroomControllers.controller('WorkroomUsersCtrl', ['$scope', '$routeParams', '$http',
  function ($scope, $routeParams, $http/*, WorkroomUsers*/) {
    $http.get('/api/workrooms/'+$routeParams.workroomId+'/users').success(function(data) {
      console.log("user data: "+data+" "+data.length);
      $scope.users = data;
    });
    $scope.workroomId = $routeParams.workroomId;
}]);

// Add a user to a room
workroomControllers.controller('InviteUserController', ['$scope', '$routeParams', '$http',
    function($scope, $routeParams, $http) {
      $scope.InviteUser = function() {
        $http.post('/api/workrooms/'+$routeParams.workroomId+'/users',
          {'inviteUserName': $scope.inviteUserName}
        ).success(function(data, status, headers, config) {
          $scope.users.push(data);
          $scope.inviteUserName='';
          console.log("Post message result: "+status+" - "+data.msg);
          console.log("Post message error: "+data.error);
        }).error(function(data, status) {
          console.log("Post message error: "+status+" "+data.error);
        });
      }
    }
  ]);
