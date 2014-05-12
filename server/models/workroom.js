var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var WorkroomSchema = new Schema({
  name: {type: String, required: true, validate: [/[a-zA-Z0-9]/, 'Workroom names should only have letters and numbers']},
  messages: [ {type: Schema.ObjectId, ref: 'MessageSchema'} ],
  users: [ {type: Schema.ObjectId, ref: 'UserSchema'} ],
  modified: { type: Date, default: Date.now }
});
WorkroomSchema.path('name').validate(function (v) {
    console.log("validate workroom name" + v);
    return v.length >= 1 && v.length < 70;
});
var Workroom = mongoose.model('Workroom', WorkroomSchema);
module.exports = Workroom;
