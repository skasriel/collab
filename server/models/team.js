// Model for (oDesk) teams
// Teams contain users. Only users that are in the same team as current user can interact with current user (e.g. see his rooms)
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TeamSchema = new Schema({
  parent_team_ref: Number,
  team_ref: {type: Number, unique: true},
  company_name: String,
  name: String,
  id: {type: String, required: true, unique: true}, // e.g. "odeskdev"
  teamroom_api: String,
  users: [ {type: Schema.ObjectId, ref: 'UserSchema'} ]
});

module.exports = mongoose.model('Team', TeamSchema);

console.log("registered team schema");
