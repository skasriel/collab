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

      // notify websockets so all logged in users refresh their messages
      // TODO: note that this isn't secure at all: should only send contents to users who are part of this room
      io.sockets.emit('send:message', {
        user: message.author_name,
        room: room._id,
        message: message.html
      });

    };
  var addMessageToRoom = module.exports.addMessageToRoom;

  function IsAuthenticated(req,res,next) {
    if(req.isAuthenticated()){
        next();
    }else{
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

  // Get messages for a room
  app.get('/api/workrooms/:id/messages', IsAuthenticated, function (req, res) {
    console.log("in /api/workrooms/:id/messages "+req.params.id);
    var room = Workroom.findById(req.params.id, function (err, workroom) {
      if (err) return console.log(err);
      console.log("looking up message(s) for workroom: "+workroom.name);
      var messages = Message
        .find({'_id': { $in: workroom.messages} })
        .populate('author', 'displayname avatarURL')
        .exec(
        function (err, messages) {
          if (err) return console.log(err);
          // return additional params (e.g. room name) before returning message list
          var roomname = new additionalParams();
          roomname.name = workroom.name;
          messages.unshift(roomname); //return workroom name first
          console.log("returning message list: "+messages.length);
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
      var now = Date.now();
      var message = new Message(
        {
          'html': req.body.html,
          'author': req.user._id,
          'author_name': req.user.username,
          'date': now
        }
      );
      console.log("current messages for: "+workroom.name+" has "+workroom.messages.length);
      addMessageToRoom(workroom, message);


      console.log("Posted: "+message);
      return res.send(message);
    });
  });

}
