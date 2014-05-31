/* Routes related to messages */
var MessageFile = require('../models/message');
var Message=MessageFile.Message, JoinMessage=MessageFile.JoinMessage;
var Workroom = require('../models/workroom');
var User = require('../models/user');
var UserSchema = User.UserSchema;

module.exports = function (app, io) {

  module.exports.addMessageToRoom =
    function (room, message) {
      console.log("adding message"+message+" to "+room.name);
      var now = Date.now();
      message.date = now;
      message.save();
      room.modified = now;
      room.messages.push(message);
      room.save();

      var roomID = room._id;
      if (room.name.charAt(0)=='@') {
        // 1:1 room, identified not by _id but by @<user1>-<user2>
        roomID = room.name;
      }
      // notify websockets so all logged in users refresh their messages
      // TODO: this isn't secure: should only send contents to users who are part of this room
      io.sockets.emit('send:message', {
        user: message.author_name,
        room: roomID,
        message: message.html
      });

    };
  var addMessageToRoom = module.exports.addMessageToRoom;

  function IsAuthenticated(req,res,next) {
    if(req.isAuthenticated()) {
        next();
    }else {
      console.log("Not authorized "+req);
        next(new Error(401));
    }
  }


  var additionalParams = function() {
    name='';
    function toString()
    {
      console.log("toString called!");
      return '"name: "+name';
    }
  };

  /** Returns a mongoose promise that can be exec()
  */
  app.getRoomByNameOrId = function(name) {
    if ((typeof name == 'string' || name instanceof String) && name.charAt(0)=='@') {
      console.log("Finding 1:1 room: "+name);
      // this is a 1:1 room, which may not have been created yet since they are created upon the first message being sent
      return Workroom.findOne({'name': name}); //name: name
    } else {
      return Workroom.findById(name);
    }
  }

  /**
  * Get messages for a workroom
  */
  app.get('/api/workrooms/:id/messages', IsAuthenticated, function (req, res) {
    console.log("in /api/workrooms/:id/messages "+req.params.id);
    var room = app.getRoomByNameOrId(req.params.id);
    room.exec(function (err, workroom) {
      if (err) return console.log(err);
      if (!workroom) {
        // 1:1 room, hasn't been created yet and that's fine
        return res.send("");
      }
      console.log("looking up message(s) for workroom: "+workroom.name);
      var messages = Message
        .find({'_id': { $in: workroom.messages} })
        .populate('author', 'displayname avatarURL')
        .exec(function (err, messages) {
          if (err) return console.log(err);
          // return additional params (e.g. room name) before returning message list
          var roomname = new additionalParams();
          roomname.name = workroom.name;
          messages.unshift(roomname); //return workroom name first
          console.log("returning message list: "+messages.length);
          return res.send(messages);
        });
    });
  });



  /**
  Post a message to a workroom
  */
  app.post('/api/workrooms/:id/messages', IsAuthenticated, function (req, res) {

    console.log("POST /api/workrooms/:id/messages "+req.params.id);
    var now = Date.now();
    var message = new Message(
      {
        'html': req.body.html,
        'author': req.user._id,
        'author_name': req.user.username,
        'date': now
      }
    );

    var roomPromise = app.getRoomByNameOrId(req.params.id);
    console.log("posting to room: "+req.params.id);
    roomPromise.exec(function (err, workroom) {
      if (err) return console.log(err);
      if (!workroom) {
        // This only happens for 1:1 rooms since they're not created in advance, create it now
        var roomName = req.params.id;
        var sepPos = roomName.indexOf('|');
        var user1 = roomName.substring(1, sepPos);
        var user2 = roomName.substring(sepPos+1);
        console.log("Users for "+req.params.id+" are "+user1+" "+user2);
        User.find({'username': { $in: [user1, user2] }}).exec(function(err, users) {
          workroom = new Workroom({
            //'_id': req.params.id, // custom mongo _id: <user1>|<user2>
            'name': req.params.id,
            'displayname1': users[0].displayname,
            'displayname2': users[1].displayname,
            'messages':  [],
            'users':     [users[0], users[1]],
            'type':      '1:1',
            'team_refs': [] // does this matter?
          });
          console.log("current messages for: "+workroom.name+" has "+workroom.messages.length);
          addMessageToRoom(workroom, message);
          return res.send(message);
        });
      } else {
        console.log("current messages for: "+workroom.name+" has "+workroom.messages.length);
        addMessageToRoom(workroom, message);
        return res.send(message);
      }
    });
  });

}
