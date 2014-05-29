var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Kanban = require('../models/kanban').Kanban;
var KanbanSchema = require('../models/kanban').KanbanSchema;


var WorkroomSchema = new Schema({
  name:      {type: String, required: true, unique: true, trim: true},
  displayname1: {type: String, trim: true}, // used for 1:1 rooms, where the "name" is something like "@<user1>-<user2>" and displayName1 is the display name of the first user
  displayname2: {type: String, trim: true},
  messages:  [ {type: Schema.ObjectId, ref: 'MessageSchema'} ],
  users:     [ {type: Schema.ObjectId, ref: 'UserSchema'} ],
  kanban:    {type: Schema.ObjectId, ref: 'KanbanSchema'},
  type:      {type: String, enum: ["public", "1:1", "private"], default: "public" },
  modified:  {type: Date, default: Date.now },
  team_refs: [Number]
});

WorkroomSchema.path('name').validate(function (v) {
    console.log("validate workroom name: " + v);
    return v.length >= 1 && v.length < 70;
});
var Workroom = mongoose.model('Workroom', WorkroomSchema);
module.exports = Workroom;
