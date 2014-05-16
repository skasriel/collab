/* Routes related to users */
var Message = require('../models/message');
var Workroom = require('../models/workroom');
var User = require('../models/user');


module.exports = function (app, io) {

  function IsAuthenticated(req,res,next) {
    if(req.isAuthenticated()){
        next();
    }else{
      console.log("Not authorized "+req);
        next(new Error(401));
    }
  }


  // returns the list of all users
  app.get('/api/users', IsAuthenticated, function (req, res) {
    console.log("GET /api/users");
    return User
      .find()
      .select('_id username displayname avatarURL')
      .sort("displayname")
      .exec(function (err, users) {
        if (err) return console.log(err);
        console.log("GET /api/users returns: "+users.length);
        return res.send(users);
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

        /*
        //username: {type: String, required: true, validate: [/[a-zA-Z0-9]/, 'user names should only have letters and numbers']},
        firstname: {type: String, required: false},
        lastname: {type: String, required: false},
        displayname: {type: String, required: false}

        */
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

    // Invite one ore more users to a room
    app.post('/api/workrooms/:id/users', IsAuthenticated, function (req, res) {
      var inviteUserIDs = req.body.inviteUserIDs; // comma separated list of user IDs to invite
      if (inviteUserIDs==null || inviteUserIDs=='' || inviteUserIDs.length==0) {
        // this is really a user asking to join, same as inviting herself... (hack...)
        inviteUserIDs = [req.user._id];
        console.log("request to join "+req.params.id+" by user "+req.user);
      }
      console.log("POST /api/workrooms/:id/users "+req.params.id+" "+inviteUserIDs);
      console.log("info params = "+inviteUserIDs.length+" "+(typeof inviteUserIDs === 'string')+ " "+(typeof inviteUserIDs === 'array'));

      var room = Workroom.findById(req.params.id, function (err, room) {
        if (err) return console.log(err);
        console.log("found room: "+room.name+" users="+room.users);
        inviteUserList = inviteUserIDs // inviteUserIDs.split(',');
        console.log("adding to list of users: "+inviteUserList);
        room.users = arrayUnique(room.users.concat(inviteUserList));
        room.save();
        console.log("Users in workroom: "+room.name+" are now: "+room.users.length+" "+room.users);
        return res.send(room);
      });
    });
  };
