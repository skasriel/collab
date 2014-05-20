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


    function buildUserNameFromOdeskProfile(profile) {
      if (!profile || !profile.name || !profile.name.givenName || !profile.name.familyName) {
        throw new Error("Invalid oDesk profile: "+profile);
      }
      return profile.name.givenName+"."+profile.name.familyName;
    }
    // oDesk passport
    passport.use(new oDeskStrategy({
      consumerKey: configAuth.oDeskAuth.clientID,
      consumerSecret: configAuth.oDeskAuth.clientSecret,
      callbackURL: configAuth.oDeskAuth.callbackURL
    },
    function(req, token, tokenSecret, profile, done) {
      console.log("verifying oDesk signin: "+profile.id+" "+profile.name.givenName+" "+profile.name.familyName);
      process.nextTick(function () {

      if (req.user) {
        throw new Error("User is already logged in");
      }
      User.findOne({ 'username' : buildUserNameFromOdeskProfile(profile) },
        function(err, user) {
          if (err)
            return done(err);

          if (user) {
            console.log("Found oDesk user, ok: "+user.username+" "+user.displayname);
            return done(null, user);
          } else {
            console.log("Creating user based on odesk info:"
              + profile.id + ","
              + token + ","
              + profile.displayName+","
              + profile.name.givenName+" "+profile.name.familyName+" "
              + profile.img
              );
            var newUser = new User();
            newUser.odesk.token = token;
            // come up with a username and display name based on data returned by google
            newUser.username = buildUserNameFromOdeskProfile(profile);
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
    function(req, googleToken, refreshToken, profile, done) { // asynchronous
      process.nextTick(function() {
        console.log("Starting google strategy");
        if (req.user) {
          throw new Error("User is already logged in as: "+req.user.username);
        }

        // check if the user is already logged in
        User.findOne({ 'google.id' : profile.id }, function(err, user) {
            if (err)
              return done(err);

            if (user) {
              console.log("Found google user, ok: "+user.username+" "+user.displayname);
              return done(null, user);
              /*
                console.log("found google user: "+user);
                // if there is a user id already but no token (user was linked at one point and then removed)
                if (!user.google.token) {
                  console.log("no google token: creating");
                  user.google.token = googleToken;
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
                }*/
            } else {
              console.log("Creating user based on google info");
              var newUser          = new User();
              newUser.google.id    = profile.id;
              newUser.google.token = googleToken;
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

              // Pull google contact book!
              var GoogleContacts = require('google-contacts').GoogleContacts;
              var c = new GoogleContacts({
                token: googleToken
              });
              c.on('error', function (e) {
                console.log('error getting contacts from google', e);
              });
              c.on('contactsReceived', function (contacts) {
                console.log('contacts: ' + contacts);
              });
              /*c.on('contactGroupsReceived', function (contactGroups) {
                console.log('groups: ' + contactGroups);
              });*/
              c.getContacts('thin', 100);
              //c.getContactGroups('thin', 200);
            }
        });
    });
  }));
};
