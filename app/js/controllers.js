'use strict';

/* AngularJS Workplace Controllers */

var checkLogin = function(status) {
  if (status == 401 || status==500) {
    console.log("got error "+status+" redirect to login screen");
    window.top.location="/login.html";
    return false;
  }
  return true;
}
var workroomControllers = angular.module('workplaceControllers', []);

// Get information about currently logged in user
workroomControllers.controller('CurrentUserCtrl', ['$scope', '$http',
  function ($scope, $http) {
    console.log('getting active user');
    $http.get('/api/user/my').success(function(data) {
      $scope.active_user = data;
      $scope.$parent.active_user = data;
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

      $scope.populateMentionBox = function() {
        $http.get('/api/users/').success(function(data) {
          //console.log("user data: "+data+" "+data.length+" $scope="+$scope);
          // Init the Mention.js
          var userData = [];
          for (var i=0; i<data.length; i++) {
            if (data[i].username == $scope.active_user.username) // can't mention myself
              continue;
            userData.push({
              name: data[i].displayname,
              username: data[i].username,
              image: data[i].avatarURL
            });
          }
          $("#new_message").mention({
            users: userData
          });

        });
      }
      $scope.populateMentionBox();

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

      // get all users to display in the drop down
      $scope.getUserList = function() {
        $http.get('/api/users/').success(function(data) {
          //console.log("user data: "+data+" "+data.length+" $scope="+$scope);
          $scope.users = data;
        });
      }
      $scope.getUserList();
    }
  ]);

  // User Settings
  workroomControllers.controller('UserSettingsCtrl', ['$scope', '$routeParams', '$http', '$upload',
    function ($scope, $routeParams, $http, $upload) {
      $http.get('/api/user/my').success(function(data) {
        $scope.user = data;
        /*username = data.username;
        $scope.firstname = data.firstname;
        $scope.lastname = data.lastname;
        $scope.avatarURL = data.avatarURL;
        $scope.userLocation = data.userLocation;
        $scope.mobilePhone = data.mobilePhone;
        $scope.twitterHandle = data.twitterHandle;
        $scope.blurb = data.blurb;*/

        console.log("user data: "+data.username+" "+data.firstname+" "+data.lastname+" "+data.avatarURL);

        // manages file upload for avatar pic (TBD)
        /*$scope.onFileSelect = function($files) {
          //$files: an array of files selected, each file has name, size, and type.
          var file = $files[0];
          $scope.upload = $upload.upload({
            url: 'server/upload/url', //upload.php script, node.js route, or servlet url
            // method: 'POST' or 'PUT',
            // headers: {'header-key': 'header-value'},
            // withCredentials: true,
            data: {myObj: $scope.myModelObj},
            file: file, // or list of files: $files for html5 only
            // set the file formData name ('Content-Desposition'). Default is 'file'
            //fileFormDataName: myFile, //or a list of names for multiple files (html5).
            // customize how data is added to formData. See #40#issuecomment-28612000 for sample code
            //formDataAppender: function(formData, key, val){}
          }).progress(function(evt) {
            console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
          }).success(function(data, status, headers, config) {
            // file is uploaded successfully
            console.log(data);
          });
          //.error(...)
          //.then(success, error, progress);
          //.xhr(function(xhr){xhr.upload.addEventListener(...)})// access and attach any event listener to XMLHttpRequest.
        }*/


        // submit form
        $scope.PostUserSettings = function() {
          $http.post('/api/user/my', $scope.user
          /*{
            'firstname': $scope.user.firstname,
            'lastname' : $scope.user.lastname,
            'displayname' : $scope.user.firstname + ' ' + $scope.user.lastname,
            'title' : $scope.user.title,
            'avatarURL' : $scope.user.avatarURL,
            'userLocation' : $scope.user.userLocation,
            'mobilePhone' : $scope.user.mobilePhone,
            'twitterHandle' : $scope.user.twitterHandle,
            'blurb': $scope.user.blurb
          }*/
          ).success(function(data, status, headers, config) {
            console.log("success: updated profile");
            //$window.location.reload(); // forcing a reload, because this scope isn't the right one and it's just easier that way...
          }).error(function(data, status) {
            console.log("Post message error: "+status+" "+data.error);
          });
        }

      });
    }
  ]);
