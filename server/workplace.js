var express = require("express"),
    path = require("path"),
    morgan = require("morgan"),
    cookieParser = require('cookie-parser'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
    //oDeskStrategy = require('passport-odesk').Strategy;

var application_root = __dirname,
    static_root = path.join(application_root, "../");

var User = require('./models/user');
var Message = require('./models/message');
var Workroom = require('./models/workroom');


// database
var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function() {
  // Create your schemas and models here.
  console.log("success");
});

var mongoURL = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/workplace_database';
console.log("Connecting to MongoDB on "+mongoURL);
mongoose.connect(mongoURL);

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// config
var app = express();



app.configure(function() {
  console.log("configuring app "+static_root);
  app.use(morgan('dev')); //express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
  app.use(express.static(path.join(application_root, "../bower_components/")));
  app.use(express.static(path.join(application_root, "../app/")));
  app.use(express.static(path.join(application_root, "../")));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
});

/*

app.use(express.static(static_root));

app.use(cookieParser('TEMP SECRET -- NOT FOR PROD'));
app.use(require('body-parser'));
app.use(require('express-session', { secret: 'Told you, this aint prod' }));

app.use(passport.initialize());
app.use(passport.session());

app.use(require('method-override'));
app.use(require('errorhandler', { dumpExceptions: true, showStack: true })); // makes the browser hang for some reason
*/





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


// launch server
// server & socket.io
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
io.sockets.on('connection', require('./routes/socket'));

// Setup routes
var routes = require('./routes');
routes(app, io);


var port = Number(process.env.PORT || 3000);
server.listen(port, function() {
  console.log("Node server listening on port: " + port);
});
