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


// Get information about current workroom
// doesn't work: can't get routeParams since it's a different controller from the one displaying the screen. f'ed up angular
/*
workroomControllers.controller('CurrentWorkroomCtrl', ['$scope', '$routeParams', '$http',
  function ($scope, $routeParams, $http) {
    if (!$routeParams.workroomId) {
      console.log('Not getting info about current workroom as there is not one');
      $scope.active_workroom = null;
      $scope.$parent.active_workroom = null;
      return;
    }
    console.log('getting info about current workroom: '+$routeParams.workroomId);
    $http.get('/api/workroom/'+$routeParams.workroomId).success(function(data) {
      $scope.active_workroom = data;
      $scope.$parent.active_workroom = data;
      console.log(' active workroom: '+data);
    })
    .error(function(data, status) {
      console.log("Get current workroom: "+status+" "+data.error);
      if (!checkLogin(status)) return;
    });
  }]);
  */


  // Get information about currently logged in user
  workroomControllers.controller('CurrentUserCtrl', ['$scope', '$rootScope', '$http',
    function ($scope, $rootScope, $http) {
      console.log('getting active user');
      $http.get('/api/user/my').success(function(data) {
        $scope.active_user = data;
        $scope.$parent.active_user = data;
        $rootScope.active_user = data;
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
    $http.get('/api/workrooms/my').success(function(data) {
      $scope.workrooms = data;
      //console.log(' workroom list: '+JSON.stringify($scope.workrooms));
    })
    .error(function(data, status) {
      console.log("Workroom list error: "+status+" "+data.error);
      if (!checkLogin(status)) return;
    })
  }]);



function formatMessages(messageList, $sce) {
  for (var i=0; i<messageList.length; i++) {
    var message = messageList[i];
    message.html = formatMessage(message.html, $sce);
    message.trustedHTML = $sce.trustAsHtml(message.html); // not secure!
  }
  return messageList;
}
function formatMessage(html, $sce) {
  var pos=0;
  while(pos<html.length) {
    pos=html.indexOf('@', pos);
    if (pos<0) {
      break;
    }
    var endMentionPos = html.indexOf(" ", pos);
    if (endMentionPos<0) endMentionPos=html.length;
    var user = html.substring(pos+1, endMentionPos);
    var newContent = '<a href="#/profile/@' + user + '">@' + user + '</a>';
    html = html.substring(0, pos)
      + newContent
      + html.substring(endMentionPos);
    pos = endMentionPos + newContent.length - user.length;
  }
  console.log("returning: "+html);
  return html;
}



// Get list of messages for a room
workroomControllers.controller('WorkroomDetailCtrl', ['$scope', '$rootScope', '$routeParams', '$http', '$sce', 'socket',
  function($scope, $rootScope, $routeParams, $http, $sce, socket) {
    $scope.getMessageList = function() {
      $scope.workroomId = $routeParams.workroomId;
      if ($scope.$parent)
        $scope.$parent.workroomId = $routeParams.workroomId; // to allow highlighting in left nav
      var url = '/api/workrooms/' + $routeParams.workroomId + "/messages";
      $http.get(url).success(function(data) {
        if (!data) {
          // empty workroom - typically only happens for 1:1 rooms that haven't yet been created;
          $scope.messages = [];
          $rootScope.workroomName = '';
          $scope.message_template = 'NoMessages.html'; // display the template for "no messages in this workroom"
          return;
        }
        $scope.message_template = "Messages.html"; // display the template for the message list
        //console.log("messages data: "+data[0].name+" "+data.length);
        var name = data.shift().name; // first entry is room name
        if (name.charAt(0)!='@') name = '#'+ name; // display channels with a leading '#'
        $scope.workroomName = name;
        $rootScope.workroomName = name;
        $scope.messages = formatMessages(data, $sce);
        //console.log("room name is: "+$scope.workroomName);
      })
      .error(function(data, status) {
        console.log("Message list error: "+status+" "+data.error);
        if (!checkLogin(status)) return;
      });
    }


    // Listen to socket.io messages to decide whether to update the current view (because someone posted on this workroom)
    socket.on('send:message', function (data) {
      console.log("got websock "+data);
      console.log('got a message: '+data.user+" "+data.room+" "+data.message);
      console.log('need to compare room to '+$routeParams.workroomId);
      if (data.room == $routeParams.workroomId) {
        console.log('This is for my room -> refresh');
        $scope.getMessageList();
      }

      // display a desktop notification
      var notificationMessage = data.user+": "+data.message
      var myNotification = new Notify(data.room, {
        body: notificationMessage,
        notifyShow: onNotifyShow,
        permissionGranted: onGranted,
        permissionDenied: onDenied
      });
      function onNotifyShow() {
        console.log('notification was shown!');
      }
      function onGranted() {
        console.log("permission granted");
        myNotification.show();
      }
      function onDenied() {alert('permission denied');}
      myNotification.show();

    });

    $scope.getMessageList();


  }]);

// Add a message to a workroom
workroomControllers.controller('AddMessageController', ['$scope', '$routeParams', '$http', 'socket', '$sce',
    function($scope, $routeParams, $http, socket, $sce) {
      $scope.PostMessage = function() {
          var url = '/api/workrooms/'+$routeParams.workroomId+'/messages';
          //console.log("post to: "+url);
          $http.post(url, {'html': $scope.message})
          .success(function(data, status, headers, config) {
            data.html = formatMessage(data.html, $sce);
            data.trustedHTML = $sce.trustAsHtml(data.html);
            $scope.messages.push(data);
            $scope.message='';
            console.log("Post message result: "+status+" - "+JSON.stringify(data));
            console.log("Post message error: "+data.error);
          }).error(function(data, status) {
            console.log("Post message error: "+status+" "+data.error);
          });
      }

      $scope.populateMentionBox = function() {
        $http.get('/api/users/').success(function(data) {
          console.log("# of users: "+data.length+" $scope="+$scope);
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
          var url = '/api/workrooms/all';
          $http.get(url)
          .success(function(data, status, headers, config) {
            $scope.all_workrooms = data;
            console.log("Get all workrooms result: "+status);
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

workroomControllers.getOneOneRoomName = function(username1, username2) {
    var smaller, larger;
    if (username1 < username2) {
      smaller = username1;
      larger = username2;
    } else {
      larger = username1;
      smaller = username2;
    }
    return '@'+smaller+'-'+larger;
  }

/**
 Add a user to a room
 */
workroomControllers.controller('InviteUserController', ['$scope', '$rootScope', '$routeParams', '$http', '$window',
    function($scope, $rootScope, $routeParams, $http, $window) {
      $scope.inviteUsers = ['Loading'];

      $scope.SelectUser = function() {
        if (!$scope.inviteUsers) return;
        var user1 = $rootScope.active_user.username;
        var user2 = $scope.inviteUsers;
        var roomName = workroomControllers.getOneOneRoomName(user1, user2);
        $window.location = '#/workrooms/'+roomName+'/messages';
        // Used by the "All People" modal to go to a specific 1:1 room
        $('#AllPeopleModal').modal('hide');
      }
      $scope.InviteUser = function() {
        // Used by the "Invite User" modal to invite a user to a specific room
        $http.post('/api/workrooms/'+$routeParams.workroomId+'/users',
          {'inviteUserNames': $scope.inviteUsers}
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
          $scope.users = data;
          console.log("# of users: "+data.length+" $scope="+$scope);
        });
      }
      $scope.getUserList();
    }
  ]);




  /**
   Profile
   */
  workroomControllers.controller('UserProfileCtrl', ['$scope', '$routeParams', '$http',
    function ($scope, $routeParams, $http) {
      $http.get('/api/user/'+$routeParams.userName).success(function(data) {
        $scope.user = data;
        console.log("user data: "+data.username+" "+data.firstname+" "+data.lastname+" "+data.avatarURL);
      });
    }
  ]);

  /**
   User Settings
   */
  workroomControllers.controller('UserSettingsCtrl', ['$scope', '$routeParams', '$http',
    function ($scope, $routeParams, $http) {
      $http.get('/api/user/my').success(function(data) {
        $scope.user = data;
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
          $http.post('/api/user/my', $scope.user).success(function(data, status, headers, config) {
            console.log("success: updated profile");
            // need to figure out the bootstrap way of notifying the user on the form that it got updated...
          }).error(function(data, status) {
            console.log("Post message error: "+status+" "+data.error);
          });
        }

      });
    }
  ]);



/**
 Kanban
 */
workroomControllers.controller('KanbanAppCtrl', ['$scope', '$http', '$window', '$routeParams', 'kanbanManipulator',
  function ($scope, $http, $window, $routeParams, kanbanManipulator) {
    $scope.workroomId = $routeParams.workroomId;
    $scope.colorOptions = ['FFFFFF','DBDBDB','FFB5B5', 'FF9E9E', 'FCC7FC', 'FC9AFB', 'CCD0FC', '989FFA', 'CFFAFC', '9EFAFF', '94D6FF','C1F7C2', 'A2FCA3', 'FAFCD2', 'FAFFA1', 'FCE4D4', 'FCC19D'];
    $scope.kanban = null;


  // <-------- Handling different events in this block ---------------> //

  // load kanban from server
  var json;
  /*json = localStorage.getItem('myPersonalKanban');
  this.kanban =  angular.fromJson(localStorage.getItem('myPersonalKanban'));*/
  var url = '/api/workrooms/'+$routeParams.workroomId+'/kanban';
  console.log("load from: "+url);
  $http.get(url).success(function(data, status, headers, config) {
    if (data=='' || data.length==0) { // create a new kanban
      console.log("creating new kanban");
      $scope.kanban = new Kanban("kanban", 3);
      var names = ["To Do", "In Progress", "Ready for Review"];
      for (var i=0;i<3;i++) {
        kanbanManipulator.addColumn($scope.kanban, names[i]);
      }
    } else {
      var json = angular.toJson(data, true);
      console.log("load result: "+json);
      $scope.kanban = angular.fromJson(json);
      console.log("kanban: "+$scope.kanban.name+" "+$scope.kanban.numberOfColumns+" "+$scope.kanban.columns[0].name);
    }
  }).error(function(data, status) {
    console.log("Load error: "+status+" "+data.error);
  });

  // watch for changes and post them back to server
  $scope.$watch('kanban', function() {
    /*var prepared = angular.toJson($scope.kanban, false);
    console.log("saving "+prepared);
    localStorage.setItem('myPersonalKanban', prepared);*/

    // Post full kanban back to server
    var url = '/api/workrooms/'+$routeParams.workroomId+'/kanban';
    console.log("post to: "+url+": "+$scope.kanban);

    $http.post(url, $scope.kanban)
    .success(function(data, status, headers, config) {
      console.log("Post kanban is ok: "+status+" - "+data.msg);
    }).error(function(data, status) {
      console.log("Post message error: "+status+" "+data.error);
    });
  }, true);

  var windowHeight = angular.element($window).height() - 250;
  $scope.minHeightOfColumn =  'min-height:'+windowHeight+'px;';

}]);
