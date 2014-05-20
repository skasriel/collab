var mongoose = require('mongoose'),
  extend = require('mongoose-schema-extend'),
  Schema = mongoose.Schema;

var MessageSchema = new Schema({
    html: {type: String, required: true},
    author: {type: Schema.ObjectId, ref: 'User', required: false},
    author_name: {type: String, required: true},
    date: { type: Date },
},
{
  collection : 'messages',
  discriminatorKey : '_type'
});
var Message = mongoose.model('Message', MessageSchema);
module.exports.Message = Message;


// A type of message used when a user joins a channel (by herself or by invitation from another user)
var JoinMessageSchema = MessageSchema.extend({
  roomName: String,
  userName: String
});
var JoinMessage = mongoose.model('JoinMessage', JoinMessageSchema);
module.exports.JoinMessage = JoinMessage;


// A type of message used when a task changes state
var TaskMessageSchema = MessageSchema.extend({
  taskName: String,
  taskAssignee: String,
  taskDueDate: String,
  taskOldState: String,
  taskNewState: String
});
var TaskMessage = mongoose.model('TaskMessage', TaskMessageSchema);
module.exports.TaskMessage = TaskMessage;
