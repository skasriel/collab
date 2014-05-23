/* Routes related to users */
var MessageModule = require('../models/message'),
  Message = MessageModule.Message,
  JoinMessage = MessageModule.JoinMessage;
var Workroom = require('../models/workroom');
var User = require('../models/user');
var MessageController = require("./message");


module.exports = function (app, io) {

  function IsAuthenticated(req,res,next) {
    if(req.isAuthenticated()){
        next();
    }else{
      console.log("Not authorized "+req);
        next(new Error(401));
    }
  }


  // returns the list of all users in the logged in user's realm
  app.get('/api/users', IsAuthenticated, function (req, res) {
    console.log("GET /api/users");
    User.findOne({'username' : req.user.username}).exec(function (err, active_user) {
      User.find()
      .select('_id username displayname avatarURL team_refs')
      .sort("displayname")
      .exec(function (err, users) {
        if (err) return console.log(err);
        var visibleUsers = [];
        users.forEach(function(user) {
          var isVisible = app.isSameRealm(user.team_refs, active_user.team_refs);
          console.log("Is user "+user.username+" "+user.team_refs+" in same realm as "+active_user.username+" "+active_user.team_refs+"? "+isVisible);
          if (isVisible)
            visibleUsers.push(user);
        });
        console.log("GET /api/users returns: "+visibleUsers.length+" visible users out of "+users.length+" total users");
        return res.send(visibleUsers);
      });
    });
  });

  // returns information about a specific user
  app.get('/api/user/:username', IsAuthenticated, function (req, res) {
    console.log("GET /api/user "+req.params.username);
    var username = req.params.username;
    if (username=='my') username = req.user.username;
    return User
      .findOne({'username' : username})
      //.select('_id username firstname lastname displayname avatarURL userLocation mobilePhone twitterHandle blurb')
      .exec(function (err, user) {
        if (err) return console.log(err);
        console.log("GET /api/user returns: "+user._id+" "+user.displayname);
        return res.send(user);
      });
  });

  // Submission of "Edit Profile" form
  app.post('/api/user/my', IsAuthenticated, function (req, res) {
    console.log("POST /api/active_user. User is: "+req.user.username+" body="+req.body);
    var user = User.findOne({'username' : req.user.username})
    .exec(
      function (err, user) {
        if (err) {
          console.log(err);
          return next(new Error(401));
        }
        user.firstname = req.body.firstname;
        user.lastname = req.body.lastname;
        user.displayname = req.body.displayname;
        user.title = req.body.title;
        user.avatarURL = req.body.avatarURL;
        user.userLocation = req.body.userLocation;
        user.mobilePhone = req.body.mobilePhone;
        user.twitterHandle = req.body.twitterHandle;
        user.skype = req.body.skype;
        user.blurb = req.body.blurb;

        user.save();
        console.log("Changed settings for user "+user.username);
        return res.send(user);
      });
  });




    // Get users for a room
    app.get('/api/workrooms/:id/users', IsAuthenticated, function (req, res) {
      console.log("in /api/workrooms/:id/users "+req.params.id);
      var room = Workroom.findById(req.params.id, function (err, workroom) {
        if (err) {
          console.log("looking up users(s): "+workroom.users);
          return next(new Error(401));
        }

        var users = User.find({'_id': { $in: workroom.users} })
        .select('username displayname _id')
        .exec(
        function (err, users) {
          if (err) {
            console.log(err);
            return next(new Error(401));
          }
          console.log("returning user list: "+users+" "+users.length);
          console.log("first user: "+users[0]);
          return res.send(users);
        });
      });
      return room;
    });


    function arrayUnique(array) {
        var a = array.concat();
        for(var i=0; i<a.length; ++i) {
            for(var j=i+1; j<a.length; ++j) {
                if(a[i] === a[j])
                    a.splice(j--, 1);
            }
        }

        return a;
    };

    // Invite one ore more users to a room or allow a user to join a workroom
    app.post('/api/workrooms/:id/users', IsAuthenticated, function (req, res) {
      console.log("POST /api/workrooms/:id/users "+req.params.id+" "+inviteUserNames);

      var inviteUserNames = req.body.inviteUserNames; // comma separated list of user IDs to invite
      if (inviteUserNames==null || inviteUserNames=='' || inviteUserNames.length==0) {
        // this is really a user asking to join, same as inviting herself... (hack...)
        inviteUserNames = [req.user.username];
        console.log("request to join "+req.params.id+" by user "+req.user);
      }

      var room = Workroom.findById(req.params.id, function (err, room) {
        if (err) return console.log(err);
        console.log("found room: "+room.name+" users="+room.users);
        console.log("adding to list of users: "+inviteUserNames);

        // Retrieve corresponding mongoDB IDs
        User
          .find({'username': { $in: inviteUserNames} })
          .exec(function (err, inviteUsers) {
            if (err) return console.log(err);

            var inviteUserIDs = new Array();
            console.log("found "+inviteUsers.length+" matching users");
            for (var i=0; i<inviteUsers.length; i++)
              inviteUserIDs.push(inviteUsers[i]._id);
            room.users = arrayUnique(room.users.concat(inviteUserIDs));
            console.log("found "+inviteUserIDs+" matching users to invite list of "+inviteUserNames);

            // Post a message to the workroom about the new user(s) joining the room
            for (var i=0; i<inviteUserNames.length; i++) {
              var joinMessage = new JoinMessage(
                {
                  'html': "@" + inviteUserNames[i]+" has joined #"+room.name,
                  'author': req.user._id,
                  'author_name': req.user.username,
                  'date': Date.now(),

                  'roomName': room.name,
                  'userName': inviteUserNames[i]
                }
              );
              console.log("Posting to channel about user "+inviteUserNames[i]);
              MessageController.addMessageToRoom(room, joinMessage);
              console.log("Done posting to channel");
            }
            room.save();
            console.log("Users in workroom: "+room.name+" are now: "+room.users.length+" "+room.users);


            return res.send(room);
          });
      });
    });
  };
