var passport = require('passport'),
    User = require('./models/user'),
    Workroom = require('./models/workroom'),
    Message = require('./models/message');

var HOME = '/main.html'
module.exports = function (app, io) {
  function IsAuthenticated(req,res,next) {
    if(req.isAuthenticated()){
        next();
    }else{
      console.log("Not authorized "+req);
        next(new Error(401));
    }
  }


  // User registration
  app.post('/api/register', function(req, res) {
      var user = new User({
          username : req.body.username,
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          displayname: req.body.firstname+" "+req.body.lastname
      });
      console.log("Creating user: "+user);

      //var user = new User({ username : req.body.username });
      User.register(user, req.body.password, function(err, account) {
      //          User.register(user, req.body.password, function(err, account) {
          console.log("error? registering user: "+err+" user: "+account);
          if (err) {
              return res.redirect('/register.html');
          }

          req.login(user, function(err) {
            if (err) { return next(err); }
            res.redirect(HOME+"#/"+req.user.username);
          });
      });
  });

  app.post('/api/login', passport.authenticate('local'), function(req, res) {
      console.log("logging in");
      res.redirect(HOME);
  });

  app.get('/api/logout', function(req, res) {
      req.logout();
      res.redirect('/register.html');
  });


  app.get('/auth/odesk', passport.authenticate('odesk'));

  app.get('/auth/odesk/callback', passport.authenticate('odesk', { failureRedirect: '/auth' }), function (req, res) {
    req.session.odesk = req.user
    res.redirect('/auth')
  });

  app.get('/auth', function (req, res) {
		console.log("/auth: "+res.locals.user);
		if (res.locals.user.odeskuserid) {
			res.redirect('/issues');
			return;
		} else res.render ('auth.html', {})
	});


  // test api
  app.get('/api', function (req, res) {
    res.send('Workplace API is running');
  });

  // Returns the active user (for display next to logout link)
  app.get('/api/active_user', IsAuthenticated, function (req, res) {
    console.log("GET /api/active_user. User is: "+req.user.username);
    return res.send(req.user.username);
  });

  // returns the list of all users
  app.get('/api/users', IsAuthenticated, function (req, res) {
    console.log("GET /api/users");
    return User
      .find()
      .select('username displayname _id')
      .sort("displayname")
      .exec(function (err, users) {
        if (err) return console.log(err);
        console.log("GET /api/users returns: "+users);
        return res.send(users);
      });
  });

  // List workrooms this user has joined
  app.get('/api/my-workrooms', IsAuthenticated, function (req, res) {
    console.log("GET /api/my-workrooms. User is: "+req.user.username);
    return Workroom
      .find()
      .sort("name _id")
      .exec(function (err, workrooms) {
        if (err) return console.log(err);
        // inefficient, but works for now: return the subset of rooms that this user has joined
        var allowed = new Array();
        console.log("Checking access to: "+workrooms.length+" workrooms");
        for(i=0; i<workrooms.length; i++) {
          var room = workrooms[i];
          var roomUsers = room.users;
          if (!roomUsers) continue;
          for (j=0; j<roomUsers.length; j++) {
            var roomUser = roomUsers[j];
            if (req.user._id.equals(roomUser)) {
              console.log("user match: "+roomUser+" is member of room: "+room.name);
              allowed.push(room);
              break;
            }
          }
        }
        console.log("returns: "+allowed.length+" allowed rooms from a total of "+workrooms.length);
        return res.send(allowed);
      });
  });

  // List all available workrooms to this user (including the ones she hasn't joined)
  app.get('/api/all-workrooms', IsAuthenticated, function (req, res) {
    console.log("GET /api/all-workrooms. User is: "+req.user.username);
    return Workroom
      .find()
      .sort("name")
      .exec(function (err, workrooms) {
        if (err) return console.log(err);
        var roomList = new Array();
        for(i=0; i<workrooms.length; i++) {
          var room = workrooms[i];
          var roomUsers = room.users;
          if (!roomUsers) continue;
          var isMember = false;
          for (j=0; j<roomUsers.length; j++) {
            var roomUser = roomUsers[j];
            if (req.user._id.equals(roomUser)) {
              isMember = true;
              break;
            }
          }
          console.log(roomUser+" membership to "+room.name+" is "+isMember);
          var roomObj = {"name": room.name, "_id": room._id, "member": (isMember?"yes":"no")};
          roomList.push(roomObj);
        }
        console.log("all-workrooms returns: "+roomList);
        return res.send(roomList);
      });
  });


  // Add a new workroom
  PostToWorkroom = function(io) {
    return function (req, res) {
    console.log("POST /api/workrooms. User is: "+req.user);
    console.log(req.body);

    var user = User.findById(req.user, function(err, user) {
      if (err) return console.log(err);
      var workroom = new Workroom({
        name: req.body.name,
        messages: [],
        users: [user]
      });
      workroom.save(function (err) {
        if (!err) {
          return console.log("created workroom!" + workroom);
        } else {
          return console.log(err);
        }
      });
      return res.send(workroom);
    });
  }
  };
  app.post('/api/workrooms', IsAuthenticated, PostToWorkroom(io));



  var additionalParams = function() {
    name='';
    function toString()
    {
      console.log("toString called!");
      return '"name: "+name';
    }
  };

  // Get messages for a room
  app.get('/api/workrooms/:id/messages', IsAuthenticated, function (req, res) {
    console.log("in /api/workrooms/:id/messages "+req.params.id);
    var room = Workroom.findById(req.params.id, function (err, workroom) {
      if (err) return console.log(err);
      console.log("looking up message(s): "+workroom.messages);
      var messages = Message
        .find({'_id': { $in: workroom.messages} })
        .exec(
        function (err, messages) {
          if (err) return console.log(err);
          // return additional params (e.g. room name) before returning message list
          var roomname = new additionalParams();
          roomname.name = workroom.name;
          messages.unshift(roomname); //return workroom name first
          console.log("returning message list: "+messages.length+" "+messages);
          return res.send(messages);
        });
    });
    return room;
  });



  // Post a message to a workroom
  app.post('/api/workrooms/:id/messages', IsAuthenticated, function (req, res) {

    console.log("POST /api/workrooms/:id/messages "+req.params.id);
    var room = Workroom.findById(req.params.id, function (err, workroom) {
      if (err) return console.log(err);
      var message = new Message(
        {'html': req.body.html,
        'author': req.user._id,
        'author_name': req.user.username}
      );
      console.log("current messages: "+workroom.messages+" "+workroom.messages.length);
      workroom.messages.push(message);
      message.save();
      workroom.save();

      // notify websockets so all logged in users refresh their messages
      // TODO: note that this isn't secure at all: should only send contents to users who are part of this room
      io.sockets.emit('send:message', {
        user: message.author_name,
        room: req.params.id,
        message: message.html
      });

      console.log("Posted: "+message);
      return res.send(message);
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
