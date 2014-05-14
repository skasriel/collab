var application_root = __dirname,
    express = require("express"),
    path = require("path"),
    mongoose = require('mongoose'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
    //oDeskStrategy = require('passport-odesk').Strategy;

/*var _ = require('gl519');

function defaultEnv(key, val) {
    if (!process.env[key])
        process.env[key] = val
}


defaultEnv("ODESK_API_KEY", "0ef06ff8bccf675f09f4e80f17d62635"); //26739894934be7c046d268680146a8d0
defaultEnv("ODESK_API_SECRET", "73ba5b50a1ddf2e1"); //b694a28f79d55f7b
*/

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

// git desk code
/*passport.use(new oDeskStrategy({
        consumerKey: process.env.ODESK_API_KEY,
        consumerSecret: process.env.ODESK_API_SECRET,
        callbackURL: "/auth/odesk/callback"
    },

    function(token, tokenSecret, profile, done) {
		_.run(function () {
        done(null, {
				id : profile.id,
				accessToken : token,
				tokenSecret : tokenSecret,
				first_name : profile.name.givenName,
				last_name : profile.name.familyName,
				portrait : "https://odesk-prod-portraits.s3.amazonaws.com/Users:mlevinson:PortraitUrl_50?AWSAccessKeyId=1XVAX3FNQZAFC9GJCFR2&Expires=2147483647&Signature=QV8ZeSrhEh2scPRQQ8IkKF%2FkaF8%3D",
			})
		})
    }
));

	passport.serializeUser(function (user, done) {
	    done(null, "none");
	})

	passport.deserializeUser(function (obj, done) {
	    done(null, {});
	})


	app.use(function (req, res, next) {
    console.log("glittle step 1");
		_.run(function(){
      console.log("glittle step 2");
			var user = {}
			if(req.session.odesk) {
        console.log("glittle step 3");
				_.print('odeskuserid = ' + req.session.odesk.id)
        user.odeskuserid = req.session.odesk.id

				user = {
					_id : req.session.odesk.id,
					odeskuserid : req.session.odesk.id,
					odeskaccessToken : req.session.odesk.accessToken,
					odesktokenSecret : req.session.odesk.tokenSecret,
					first_name : req.session.odesk.first_name,
					last_name : req.session.odesk.familyName,
					email : req.session.github.email,
					portrait : req.session.odesk.portrait,
					team : req.session.team
				}; // end setting user variable
						  //_.p(db.collection("users").insert(user, _.p()))
			  console.log("user = "+user);
      }
		  req.user = user;
      res.locals.user = req.user;
      next();
		}); // end _.run
	}); // end app.use

*/

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



// emitter to connect socket.io to routers
/*var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
app.use(function(req, res, next) {
  req.emitter = emitter;
  next();
});*/

// launch server
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
io.sockets.on('connection', require('./routes/socket'));

// Setup routes
var routes = require('./routes');
routes(app, io);

server.listen(3000);
