/* Routes related to workrooms */
var Workroom = require('../models/workroom');

module.exports = function (app, io) {

  function IsAuthenticated(req,res,next) {
    if(req.isAuthenticated()){
        next();
    }else{
      console.log("Not authorized "+req);
        next(new Error(401));
    }
  }

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
              //console.log("user match: "+roomUser+" is member of room: "+room.name);
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
          //console.log(roomUser+" membership to "+room.name+" is "+isMember);
          var roomObj = {"name": room.name, "_id": room._id, "member": (isMember?"yes":"no")};
          roomList.push(roomObj);
        }
        console.log("all-workrooms returns: "+roomList.length);
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

}
