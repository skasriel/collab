var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MessageSchema = new Schema({
    html: {type: String, required: true},
    author: {type: Schema.ObjectId, ref: 'User', required: true},
    author_name: {type: String, required: true},
    date: { type: Date }
});
var Message = mongoose.model('Message', MessageSchema);
module.exports = Message;
