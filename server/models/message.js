var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MessageSchema = new Schema({
    html: String,
    author: {type: Schema.ObjectId, ref: 'UserSchema', required: true},
    author_name: String
});
var Message = mongoose.model('Message', MessageSchema);
module.exports = Message;
