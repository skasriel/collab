var application_root = __dirname,
    express = require("express"),
    path = require("path"),
    mongoose = require('mongoose'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;


var app = express();

// database

var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function() {
  // Create your schemas and models here.
  console.log("success");
});
mongoose.connect('mongodb://localhost/workplace_database');

// config
console.log("configuring app");
app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
app.use(express.cookieParser('TEMP SECRET -- NOT FOR PROD'));
app.use(express.bodyParser());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

app.use(express.methodOverride());
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
app.use(express.static(path.join(application_root, "../")));



var User = require('./models/user');
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

var Message = require('./models/message');
var Workroom = require('./models/workroom');
console.log("done configuring app");




var addObj = function(obj) {
  obj.save(function(err, obj) {
    if (err) return console.error(err);
    //console.dir(obj);
  });
};


var populateDB = function() {

  console.log("Populating DB");

  mongoose.connection.db.dropDatabase(
      function(err, result) {
        console.log("Here");
        if (err) return console.error(err);
        //console.dir(obj);
        console.log("dropped");
      });

  var skasriel = new User({
    "username": "skasriel",
    "displayname": "Stephane Kasriel"
  });
  addObj(skasriel);

  var stratis = new User({
    "username": "stratis",
    "displayname": "Stratis K"
  });
  addObj(stratis);
  var seank = new User({
    "username": "seank",
    "displayname": "Sean K"
  });
  addObj(seank);

  var message1 = new Message({
    "html": "Welcome to the #general room",
    "author": stratis
  });
  addObj(message1);

  var message2 = new Message({
    "html": "Welcome to the #random room",
    "author": skasriel
  });
  addObj(message2);
  var message3 = new Message({
    "html": "This is a room for random messages :)",
    "author": skasriel
  });
addObj(message3);


  var general = new Workroom({
    "name": "general",
    messages: [message1, message3],
    users: [skasriel, stratis]
  });
  addObj(general);
  var random = new Workroom({
    "name": "random",
    messages: [message2, message3],
    users: [skasriel, seank]
  });
  addObj(random);

  console.log("Done populating DB");


};

// create a database
//populateDB();



// Setup routes
require('./routes')(app);

// launch server
app.listen(3000);
