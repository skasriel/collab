/* Routes related to kanban boards */
var Kanban = require('../models/kanban').Kanban;
var KanbanSchema = require('../models/kanban').KanbanSchema;
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

  // Get full kanban data
  app.get('/api/workrooms/:id/kanban', IsAuthenticated, function (req, res) {
    console.log("in /api/workrooms/:id/kanban "+req.params.id);
    Workroom.findById(req.params.id)/*.populate('kanban')*/.exec(function (err, room) {
      if (err) return console.log(err);
      Kanban.findById(room.kanban).exec(function(err, kanban) {
        if (kanban==null || !kanban) {
          return res.send(""); // empty kanban
        }
        var kanbanObj = kanban.toObject();
        delete kanbanObj["__v"];
        delete kanbanObj["_id"];
        var json = JSON.stringify(kanbanObj);
        console.log("found kanban for workroom: "+room.name+" "+kanban.name+": "+json);
        res.send(json);
        console.log("ok, sent");
      });
    });
  });

  // Save full kanban data
  app.post('/api/workrooms/:workroomId/kanban', IsAuthenticated, function (req, res) {
    console.log("Saving full kanban for workroom"+req.params.workroomId);
    var room = Workroom.findById(req.params.workroomId).exec(
      function (err, room) {
        if (err) return console.log(err);
        var kanbanID = room.kanban;
        Kanban.findByIdAndUpdate(kanbanID, req.body, null, function(err, kanban) {
          if (err) return console.log(err);
          if (kanban==null) {
            // creating kanban
            var kanbanJSON = JSON.stringify(req.body)
            console.log("new kanban, yeah: "+kanbanJSON);
            kanban = new Kanban(req.body);
            room.kanban = kanban;
            room.save();
            console.log("added new kanban to room");
          }
          console.log("saving kanban "+kanban.name+" in room "+room.name+" as "+JSON.stringify(kanban));
          kanban.save();
          return res.send(kanban);
        });
      });
  });

/*
  // Add a card to a column
  app.post('/api/workrooms/:workroomId/kanban/:columnId', IsAuthenticated, function (req, res) {

    console.log("Adding a card to a kanban column "+req.params.columnId);
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
  });*/

}
