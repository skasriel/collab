// load all the things we need
var LocalStrategy    = require('passport-local').Strategy;
var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;
var oDeskStrategy = require('./passport-odesk/index.js').Strategy;

// load up the user model
var User       = require('./models/user');

// load the auth variables
var configAuth = require('./config/auth');

module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    /*passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });*/

    // Regular username/password
    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());


    // oDesk passport
    passport.use(new oDeskStrategy({
      consumerKey: configAuth.oDeskAuth.clientID,
      consumerSecret: configAuth.oDeskAuth.clientSecret,
      callbackURL: configAuth.oDeskAuth.callbackURL
    },
    function(req, token, tokenSecret, profile, done) {
      console.log("verifying oDesk signin: "+profile.id+" found email="+profile.emails.length+" "+profile.emails[0].value);
      process.nextTick(function () {


      if (!req.user) {
        User.findOne({ 'odesk.id' : profile.id }, function(err, user) {
            if (err)
              return done(err);

            if (user && profile.id) {
                console.log("found odesk user: "+user);
                // if there is a user id already but no token (user was linked at one point and then removed)
                if (!user.odesk.token) {
                  console.log("no odesk token: creating");
                  user.odesk.token = token;
                  user.odesk.name  = profile.displayName;
                  user.odesk.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email (always null...)

                  // come up with a username and display name based on data returned by odesk (e.g. no email)
                  user.username = user.odesk.name.givenName+"."+user.odesk.name.familyName; //user.odesk.email;
                  user.displayname = profile.displayName;
                  user.firstname = user.odesk.name.givenName;
                  user.lastname = user.odesk.name.familyName;
                  user.avatarURL = user.odesk.img;
                  console.log("creating user: "+user.displayname);

                  user.save(function(err) {
                      if (err)
                          throw err;
                      console.log("saved user: "+user);
                      return done(null, user);
                  });
                }
                return done(null, user);
            } else {
              console.log("existing odesk user with token:"
                + profile.id + ","
                + token + ","
                + profile.displayName+","
                + profile.name.givenName+" "+profile.name.familyName+" "
                + profile.img
                );
              var newUser = new User();
              newUser.odesk.id    = profile.id;
              newUser.odesk.token = token;
              newUser.odesk.name  = profile.displayName;
              newUser.odesk.displayName  = profile.displayName;
              newUser.odesk.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

              // come up with a username and display name based on data returned by google
              newUser.username = profile.name.givenName+"."+profile.name.familyName; //newUser.odesk.email;
              newUser.displayname = profile.displayName;
              newUser.firstname = profile.name.givenName;
              newUser.lastname = profile.name.familyName;
              newUser.avatarURL = profile.img;

              newUser.save(function(err) {
                if (err) throw err;
                console.log("saved user: "+newUser);
                return done(null, newUser);
              });
            }
        });
      } else {
        // user already exists and is logged in, we have to link accounts
        var user = req.user; // pull the user out of the session
        console.log("existing odesk user: "+user+" "+user.username+" "+user.displayname);

        user.odesk.id    = profile.id;
        user.odesk.token = token;
        user.odesk.name  = profile.displayName;
        user.odesk.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
        user.odesk.emails = [{"value":user.odesk.email,"type":"work"}],

        // come up with a username and display name based on data returned by google
        //user.username = user.odesk.email;
        //user.displayname = user.odesk.name;

        user.save(function(err) {
            if (err)
                throw err;
            return done(null, user);
        });
      }
    });
  }));



    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    passport.use(new GoogleStrategy({

        clientID        : configAuth.googleAuth.clientID,
        clientSecret    : configAuth.googleAuth.clientSecret,
        callbackURL     : configAuth.googleAuth.callbackURL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, refreshToken, profile, done) { // asynchronous
      process.nextTick(function() {
        // check if the user is already logged in
        if (!req.user) {
          User.findOne({ 'google.id' : profile.id }, function(err, user) {
              if (err)
                return done(err);

              if (user) {
                  console.log("found google user: "+user);
                  // if there is a user id already but no token (user was linked at one point and then removed)
                  if (!user.google.token) {
                    console.log("no google token: creating");
                    user.google.token = token;
                    user.google.name  = profile.displayName;
                    user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

                    // come up with a username and display name based on data returned by google
                    user.username = user.google.email;
                    user.displayname = user.google.name;

                    user.save(function(err) {
                        if (err)
                            throw err;
                        console.log("saved user: "+user);
                        return done(null, user);
                    });
                  }
                  return done(null, user);
              } else {
                console.log("existing google user with token");
                var newUser          = new User();
                newUser.google.id    = profile.id;
                newUser.google.token = token;
                newUser.google.name  = profile.displayName;
                newUser.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

                // come up with a username and display name based on data returned by google
                newUser.username = newUser.google.email;
                newUser.displayname = newUser.google.name;

                newUser.save(function(err) {
                  if (err)
                      throw err;
                  console.log("saved user: "+newUser);
                  return done(null, newUser);
                });
              }
          });
        } else {
          // user already exists and is logged in, we have to link accounts
          var user               = req.user; // pull the user out of the session
          console.log("existing google user: "+user+" "+user.username+" "+user.displayname);

          user.google.id    = profile.id;
          user.google.token = token;
          user.google.name  = profile.displayName;
          user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

          // come up with a username and display name based on data returned by google
          //user.username = user.google.email;
          //user.displayname = user.google.name;

          user.save(function(err) {
              if (err)
                  throw err;
              return done(null, user);
          });
        }
    });
  }));
};
