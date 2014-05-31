// load all the things we need
var LocalStrategy    = require('passport-local').Strategy;
var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;
var oDeskStrategy = require('./passport-odesk/strategy');
var Team = require('./models/team');
var wait=require('wait.for');


// load up the user model
var User = require('./models/user');

// load the auth variables
var configAuth = require('./config/auth');

module.exports.passport = function(passport) {

    // Regular username/password (boring)
    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

    function buildUserNameFromOdeskProfile(profile) {
      if (profile.id)
        return profile.id;

      if (!profile || !profile.name || !profile.name.givenName || !profile.name.familyName) {
        throw new Error("Invalid oDesk profile: "+profile);
      }
      return profile.name.givenName+"."+profile.name.familyName;
    }

    /* This function and its sister function are a nested loop to get all teams the user "newUser" belongs to,
    and, for each team, the list of all other users in that team. Because node is async, that creates tons of race conditions.
    To simplify things, these two functions call each other to create synchronous calls, at the risk of deep recursion and stack overflow...
    I tried using wait.for, couldn't make it work. Someone smarter may know how to do this :).
    The goal of this is to automatically show newUser the list of all her team members so she can add them to specific work rooms
    */
    function buildTeamMemberData(profile, newUser, teamArray, i, team, teamMembers, j) {
      if (j==teamMembers.length) { // done with inner loop, increment outer loop
        return buildTeamArrayData(profile, newUser, teamArray, i+1);
      }
      console.log("Inner j="+j+" max="+teamMembers.length);
      var teamMember = teamMembers[j];
      // Find whether the user exist before creating it (username unicity!)
      User.findOne({'username' : teamMember.id}).exec(function (err, user) {
        if (err) {
          throw err;
        }
        if (user) {
          console.log("User already exists, not creating again: "+user.username+"=="+teamMember.id);
          console.log("adding member: "+user.username+" to team "+team.name);
          team.users.push(user);
          team.save(function(err) {
            if (err) throw err;
            console.log("saved team: "+team.name);
            buildTeamMemberData(profile, newUser, teamArray, i, team, teamMembers, j+1);
          });
        } else {
          console.log("creating new user: "+teamMember.id);
          user = new User({
            "username": teamMember.id, // should use buildUserNameFromOdeskProfile()
            "firstname": teamMember.first_name,
            "lastname": teamMember.last_name,
            "displayname": teamMember.first_name+" "+teamMember.last_name,
            "team_refs": [team.team_ref],
            "teams": [team]
          });
          user.save(function(err) {
            if (err) throw err;
            console.log("created new user: "+user.username);
            // done so now call the next inner loop
            console.log("adding member: "+user.username+" to team "+team.name);
            team.users.push(user);
            team.save(function(err) {
              if (err) throw err;
              console.log("saved team: "+team.name);
              buildTeamMemberData(profile, newUser, teamArray, i, team, teamMembers, j+1);
            });
          });
        }
      });
    }
    function buildTeamArrayData(profile, newUser, teamArray, i) {
      if (i==teamArray.length) // we're done with everything
        return;
      console.log("Outer i="+i+" Max="+teamArray.length);
      // add each team to the list of teams
      var teamInfo = teamArray[i];
      var team = new Team({
        "parent_team_ref": teamInfo.parent_team_ref,
        "team_ref": teamInfo.team_ref,
        "company_name": teamInfo.company_name,
        "name": teamInfo.name,
        "id": teamInfo.id,
        "teamroom_api": teamInfo.teamroom_api,
        "users": []
      });
      console.log("Adding team: "+JSON.stringify(team));
      newUser.teams.push(team);
      var teamRef = teamInfo.team_ref;
      newUser.team_refs.push(teamRef);
      newUser.save(function(err) {
        if (err) throw err;
        console.log("saved user: "+newUser);
      });


      console.log("Downloading data for team: "+JSON.stringify(teamRef));
      // get everyone on the team
      profile.oauth.get('https://www.odesk.com/api/hr/v2/teams/'+teamRef+'/users.json', profile.token, profile.tokenSecret,
      //wait.for(profile.oauth.get, 'https://www.odesk.com/api/hr/v2/teams/'+teamRef+'/users.json', profile.token, profile.tokenSecret,
      function (err, body, res) {
        if (err) {
          console.trace("error retrieving data for team");
          buildTeamArrayData(profile, newUser, teamArray, i+1); // move to the next team
          return;
        }
        console.log("Getting user list in team: "+teamRef);
        var data = JSON.parse(body);
        var teamMembers = data.users;
        if (teamMembers) // non empty team
          buildTeamMemberData(profile, newUser, teamArray, i, team, teamMembers, 0); // get users one by one for this team
      });
    }

    /**
    Add the oDesk Passport Strategy and its next() function
    */
    var strat = new oDeskStrategy({
      consumerKey: configAuth.oDeskAuth.clientID,
      consumerSecret: configAuth.oDeskAuth.clientSecret,
      callbackURL: configAuth.oDeskAuth.callbackURL
    },
    function(req, token, tokenSecret, profile, done) { // verification callback from passport
      console.log("verifying oDesk signin: "+profile.id+" "+profile.name.givenName+" "+profile.name.familyName);
      process.nextTick(function () {

        // make the oauth info available for controllers who need to call the oDesk APIs (e.g. to send invitations via message center)   
        var me = strat;
        me.profile = profile;
        me.oauth = profile.oauth;
        me.token = profile.token;
        me.tokenSecret = profile.tokenSecret;

        if (req.user)
          throw new Error("User is already logged in");
        User.findOne({ 'username' : buildUserNameFromOdeskProfile(profile) },
          function(err, user) {
            if (err) {
              console.log("error oDesk login: "+err);
              return done(err);
            } else if (user) {
              console.log("Found oDesk user, ok: "+user.username+" "+user.displayname);
              return done(null, user);
            }

            console.log("Creating user based on odesk info:"
              + profile.id + ","
              + token + ","
              + profile.displayName+","
              + profile.name.givenName+" "+profile.name.familyName+" "
              + profile.img
              );
            var newUser = new User();
            newUser.odesk.token = token;
            // come up with a username and display name based on data returned by odesk
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



            // Get the list of teams for this oDesk user
            profile.oauth.get('https://www.odesk.com/api/team/v2/teamrooms.json', profile.token, profile.tokenSecret, function (err, body, res) {
              var teamData = JSON.parse(body);
              var teamInfo = teamData.teamrooms.teamroom;
              //wait.launchFiber(buildTeamArrayData, profile, newUser, teamInfo);
              // Now go get the list of all users for each team, one at a time (serially, not in parallel)
              buildTeamArrayData(profile, newUser, teamInfo, 0);
            });

          });
      });
    });
    passport.use(strat);
    module.exports.oDeskStrategy = strat;


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
