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


  // List workrooms this user has joined
  app.get('/api/workrooms/:listType', IsAuthenticated, function (req, res) {
    console.log("GET /api/workrooms/"+req.params.listType+". User is: "+req.user.username);
    return Workroom
      .find()
      .sort("name")
      .exec(function (err, workrooms) {
        if (err) return console.log(err);
        var roomList = new Array();
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
