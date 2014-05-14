var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');


var UserSchema = new Schema({
  // username, password are handled by passport
  firstname: {type: String, required: false, trim: true},
  lastname: {type: String, required: false, trim: true},
  displayname: {type: String, required: false, trim: true}
});

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', UserSchema);
