var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');


var UserSchema = new Schema({
  //username: {type: String, required: true, validate: [/[a-zA-Z0-9]/, 'user names should only have letters and numbers']},
  firstname: {type: String, required: false},
  lastname: {type: String, required: false},
  displayname: {type: String, required: false}
});

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', UserSchema);
