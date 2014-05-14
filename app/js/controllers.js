'use strict';

/* AngularJS Workplace Controllers */

var checkLogin = function(status) {
  if (status == 401 || status==500) {
    console.log("got error "+status+" redirect to login screen");
    window.top.location="/app/register.html";
    return false;
  }
  return true;
}
var workroomControllers = angular.module('workplaceControllers', []);

// Get name of currently logged in user
workroomControllers.controller('CurrentUserCtrl', ['$scope', '$http',
  function ($scope, $http) {
    console.log('getting active user');
    $http.get('/api/active_user').success(function(data) {
      $scope.active_user = data;
      console.log(' active user: '+data);
    })
    .error(function(data, status) {
      console.log("Get current user list error: "+status+" "+data.error);
      if (!checkLogin(status)) return;
    });
  }]);

// Get list of all workrooms which logged in user is a member of
workroomControllers.controller('WorkroomCtrl', ['$scope', '$http', '$window',
  function ($scope, $http, $window) {
    //$scope.workrooms = Workroom.query();
    console.log('getting workroom list');
    $http.get('/api/my-workrooms').success(function(data) {
      $scope.workrooms = data;
      //console.log(' workroom list: '+$scope.workrooms);
    })
    .error(function(data, status) {
      console.log("Workroom list error: "+status+" "+data.error);
      if (!checkLogin(status)) return;
    })
  }]);



// Get list of messages for a room
workroomControllers.controller('WorkroomDetailCtrl', ['$scope', '$routeParams', '$http', 'socket',
  function($scope, $routeParams, $http, socket) {
    $scope.getMessageList = function() {
      $scope.workroomId = $routeParams.workroomId;
      $scope.$parent.workroomId = $routeParams.workroomId; // to allow highlighting in left nav
      var url = '/api/workrooms/' + $routeParams.workroomId + "/messages";
      $http.get(url).success(function(data) {
        //console.log("messages data: "+data[0].name+" "+data.length);
        $scope.workroomName = data.shift().name; // first entry is room name
        $scope.messages = data;
        //console.log("room name is: "+$scope.workroomName);
      })
      .error(function(data, status) {
        console.log("Message list error: "+status+" "+data.error);
        if (!checkLogin(status)) return;
      });
    }
    socket.on('send:message', function (data) {
      console.log("got websock "+data);
      console.log('got a message: '+data.user+" "+data.room+" "+data.message);
      console.log('need to compare room to '+$routeParams.workroomId);
      if (data.room == $routeParams.workroomId) {
        console.log('This is for my room -> refresh');
        $scope.getMessageList();
      }
    });
    $scope.getMessageList();
  }]);

// Add a message to a workroom
workroomControllers.controller('AddMessageController', ['$scope', '$routeParams', '$http', 'socket',
    function($scope, $routeParams, $http, socket) {
      $scope.PostMessage = function() {
          var url = '/api/workrooms/'+$routeParams.workroomId+'/messages';
          //console.log("post to: "+url);
          $http.post(url, {'html': $scope.message})
          .success(function(data, status, headers, config) {
            $scope.messages.push(data);
            $scope.message='';
            //console.log("Post message result: "+status+" - "+data.msg);
            //console.log("Post message error: "+data.error);
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
          //console.log("post to: "+url);
          $http.post(url,
            {'name': $scope.workroomName}
          ).success(function(data, status, headers, config) {
            console.log("Post message result: "+status+" - "+data+" "+$scope.$parent.workrooms+" err="+data.error);
            $scope.$parent.workrooms.push(data); // refresh list of workrooms to reflect new room
            $('#AddWorkroomModal').modal('hide'); // close modal dialog
          }).error(function(data, status) {
            console.log("Post message error: "+status+" "+data.error);
          });
      }
    }]);

// join an existing workroom
workroomControllers.controller('JoinWorkroomController', ['$scope', '$routeParams', '$http',
  function($scope, $routeParams, $http) {
      $scope.GetAllWorkrooms = function() {
          var url = '/api/all-workrooms/';
          $http.get(url)
          .success(function(data, status, headers, config) {
            $scope.all_workrooms = data;
            console.log("Get all workrooms result: "+status+" - "+data);
          }).error(function(data, status) {
            console.log("Get all workroom error: "+status+" "+data.error);
          });
      }
      $scope.GetAllWorkrooms();

      $scope.JoinWorkroom = function(roomId) {
        $http.post('/api/workrooms/'+roomId+'/users')
        .success(function(data, status, headers, config) {
          $('#JoinWorkroomModal').modal('hide'); // close modal dialog
          window.location.href="#/workrooms/"+roomId;
          window.location.reload();
        }).error(function(data, status) {
          console.log("Post message error: "+status+" "+data.error);
        });
      }
    }]);




// Get list of users in a room
workroomControllers.controller('WorkroomUsersCtrl', ['$scope', '$routeParams', '$http',
  function ($scope, $routeParams, $http) {
    $http.get('/api/workrooms/'+$routeParams.workroomId+'/users').success(function(data) {
      //console.log("user data: "+data+" "+data.length+" $scope="+$scope);
      $scope.users = data;
    });
    $scope.workroomId = $routeParams.workroomId;
}]);

// Add a user to a room
workroomControllers.controller('InviteUserController', ['$scope', '$routeParams', '$http', '$window',
    function($scope, $routeParams, $http, $window) {
      $scope.inviteUsers = ['Loading'];
      $scope.InviteUser = function() {
        $http.post('/api/workrooms/'+$routeParams.workroomId+'/users',
          {'inviteUserIDs': $scope.inviteUsers}
        ).success(function(data, status, headers, config) {
          /*console.log("old user list: "+$scope.users+" scope="+$scope);
          $scope.users.push($scope.inviteUsers);
          console.log("new user list: "+$scope.users);
          $scope.inviteUsers='';
          console.log("Post message result: "+status+" - "+data.msg);*/
          $('#InviteUserModal').modal('hide'); // close modal dialog
          $window.location.reload(); // forcing a reload, because this scope isn't the right one and it's just easier that way...
        }).error(function(data, status) {
          console.log("Post message error: "+status+" "+data.error);
        });
      }

      $scope.getUserList = function() {
        $http.get('/api/users/').success(function(data) {
          //console.log("user data: "+data+" "+data.length+" $scope="+$scope);
          $scope.users = data;
        });
      }
      $scope.getUserList();
    }
  ]);
