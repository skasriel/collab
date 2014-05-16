var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');


var UserSchema = new Schema({
  firstname: {type: String, required: false, trim: true},
  lastname: {type: String, required: false, trim: true},
  displayname: {type: String, required: true, trim: true},
  avatarURL: String,
  title: String,
  userLocation: String,
  mobilePhone: String,
  twitterHandle: String,
  blurb: String,

  // username, password are handled by local passport

  // google credentials
  google           : {
    id           : String,
    token        : String,
    email        : String,
    name         : String
  },

  // oDesk credentials
  odesk           : {
    token        : String,
  }


});


UserSchema.plugin(passportLocalMongoose);
UserSchema.path('username').index({ unique: true });
module.exports = mongoose.model('User', UserSchema);
module.exports.UserSchema = UserSchema;

console.log("registered user schema");
