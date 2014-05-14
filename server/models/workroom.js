var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var WorkroomSchema = new Schema({
  name: {type: String, required: true, unique: true, trim: true},
  messages: [ {type: Schema.ObjectId, ref: 'MessageSchema'} ],
  users: [ {type: Schema.ObjectId, ref: 'UserSchema'} ],
  modified: { type: Date, default: Date.now }
});
WorkroomSchema.path('name').validate(function (v) {
    console.log("validate workroom name: " + v);
    return v.length >= 1 && v.length < 70;
});
var Workroom = mongoose.model('Workroom', WorkroomSchema);
module.exports = Workroom;
