/* Routes related to workrooms */
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

  app._intersect = function(a, b) {
    var d = {};
    var results = [];
    for (var i = 0; i < b.length; i++) {
        d[b[i]] = true;
    }
    for (var j = 0; j < a.length; j++) {
        if (d[a[j]])
            results.push(a[j]);
    }
    return results;
  }

  app.isSameRealm = function(room_teams, user_teams) {
    if (!room_teams) {
      console.log("Workroom has no team info - not accessible to anyone!");
      return false;
    } else if (!user_teams) {
      console.log("User has no team info - can't access any rooms!");
      return false;
    }
    return app._intersect(room_teams, user_teams).length > 0;
  }

  // List workrooms this user has joined
  app.get('/api/workrooms/:listType', IsAuthenticated, function (req, res) {
    console.log("GET /api/workrooms/"+req.params.listType+". User is: "+req.user.username);
    var roomList = new Array();
    Workroom
      .find()
      .sort("name")
      .exec(function (err, workrooms) {
        if (err) return console.log(err);
        // inefficient, but works for now: return the subset of rooms that this user has joined
        for(i=0; i<workrooms.length; i++) {
          var room = workrooms[i];
          var roomUsers = room.users;
          if (!roomUsers) continue;
          var isMember = false;
          for (j=0; j<roomUsers.length; j++) {
            var roomUser = roomUsers[j];
            if (req.user._id.equals(roomUser)) {
              isMember=true;
              break;
            }
          }
          if (!isMember) {
            var isAvailable = app.isSameRealm(room.team_refs, req.user.team_refs);
            console.log("Is room "+room.name+" available to "+req.user.username+"? "+isAvailable);
            if (!isAvailable) // this room isn't accessible to this user, because they don't have any teams in common
              continue;
          }
          if (req.params.listType=='all' || isMember) {
            // add to list: either client requested all rooms, or if it requested "my" rooms, this one fits the bill
            var roomObj = {
              "name": room.name,
              "_id": room._id,
              "type": room.type,
              "modified": room.modified,
              "member": (isMember?"yes":"no")
            };
            roomList.push(roomObj);
          }
        }
        console.log("returns: "+roomList.length+" allowed rooms from a total of "+workrooms.length);

        // Now get the list of 1:1 rooms, i.e. all the users that the active user can communicate with
        User.findOne({'username' : req.user.username}).exec(function (err, active_user) {
          User.find()
          .select('_id username displayname avatarURL team_refs')
          .sort("displayname")
          .exec(function (err, users) {
            if (err) return console.log(err);
            users.forEach(function(user) {
              var isVisible = app.isSameRealm(user.team_refs, active_user.team_refs);
              console.log("Is user "+user.username+" "+user.team_refs+" in same realm as "+active_user.username+" "+active_user.team_refs+"? "+isVisible);
              if (isVisible) {
                var roomObj = {
                  "name": user.displayname,
                  "_id": '???',
                  "type": '1:1',
                };
                roomList.push(roomObj);
              }
            });
            return res.send(roomList);
          });
        });
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
          users: [user],
          team_refs: user.team_refs
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

}
