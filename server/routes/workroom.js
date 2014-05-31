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

  /**
  Whether two users are in the same realm, based on whether they have at least one team in common
  This is anything but scalable, will need to think about a better data model at some point...
  (Should be a service)
  */
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


  /**
   1:1 rooms are called @<user1>|<user2>, sorted alphabetically to ensure that there is no <user2>|<user1>
   */
  app.getOneOneRoomName = function(username1, username2) {
    var smaller, larger;
    if (username1 < username2) {
      smaller = username1;
      larger = username2;
    } else {
      larger = username1;
      smaller = username2;
    }
    return '@'+smaller+'|'+larger;
  }

  /**
   List workrooms this user has joined or list all rooms available to this user (same realm)
   :listType is either "all" or "my"
   */
  app.get('/api/workrooms/:listType', IsAuthenticated, function (req, res) {
    console.log("GET /api/workrooms/"+req.params.listType+". User is: "+req.user.username);
    var roomList = new Array();
    var roomSet = {};
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
            var roomName, roomID;
            if (room.type=='1:1') {
              roomID = room.name;
              var user1 = room.displayname1;
              var user2 = room.displayname2;
              if (req.user.displayname == user1)
                roomName = user2;
              else
                roomName = user1;
            } else {
              roomName = room.name;
              roomID = room._id;
            }
            var roomObj = {
              "name": roomName,
              "_id": roomID,
              "type": room.type,
              "modified": room.modified,
              "numMessages": room.messages.length,
              "member": (isMember?"yes":"no")
            };
            roomSet[room._id]=true;
            roomList.push(roomObj);

            console.log("sending room: "+JSON.stringify(roomObj));
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
              //console.log("Is user "+user.username+" "+user.team_refs+" in same realm as "+active_user.username+" "+active_user.team_refs+"? "+isVisible);
              if (isVisible) {
                var roomName = app.getOneOneRoomName(user.username, active_user.username);
                if (!roomSet[roomName]) {
                  // This room doesn't exist yet, otherwise it would have been added to the roomSet. Send it in the list so users can start the conversation
                  var roomObj = {
                    "name": user.displayname,
                    "_id": roomName,
                    "numMessages": 0,
                    "type": '1:1',
                  };
                  roomList.push(roomObj);
                }
              }
            });
            return res.send(roomList);
          });
        });
      });
  });

  /**
  Create a new workroom
  */
  CreateNewWorkroom = function(io) {
    return function (req, res) {
      console.log("POST /api/workrooms. User is: "+req.user+" body="+req.body);

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
  app.post('/api/workrooms', IsAuthenticated, CreateNewWorkroom(io));

}
