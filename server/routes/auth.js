/* Routes related to authorization/authentication and user management */

var passport = require('passport'),
    User = require('../models/user');

var HOME = '/index.html', LOGIN='/login.html';


module.exports = function (app, io) {
  function IsAuthenticated(req,res,next) {
    if(req.isAuthenticated()){
        next();
    }else{
      console.log("Not authorized "+req);
        next(new Error(401));
    }
  }


  // User registration
  app.post('/api/register', function(req, res) {
      var user = new User({
          username : req.body.username,
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          displayname: req.body.firstname+" "+req.body.lastname
      });
      console.log("Creating user: "+user);

      //var user = new User({ username : req.body.username });
      User.register(user, req.body.password, function(err, account) {
          console.log("error? registering user: "+err+" user: "+account);
          if (err) {
              return res.redirect('/register.html');
          }

          req.login(user, function(err) {
            if (err) { return next(err); }
            res.redirect(HOME+"#/"+req.user.username);
          });
      });
  });

  app.post('/api/login', passport.authenticate('local'), function(req, res) {
      console.log("logging in");
      res.redirect(HOME);
  });

  app.get('/api/logout', function(req, res) {
      req.logout();
      res.redirect(LOGIN);
  });


  // oDesk -----
  // GET /auth/odesk
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  The first step in odesk authentication will involve redirecting
  //   the user to odesk.com.  After authorization, the odesk will redirect
  //   the user back to this application at /auth/odesk/callback
  app.get('/auth/odesk',
    passport.authenticate('odesk'),
    function(req, res){
      // The request will be redirected to odesk for authentication, so this
      // function will not be called.
    });

  // GET /auth/odesk/callback
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function function will be called,
  //   which, in this example, will redirect the user to the home page.
  app.get('/auth/odesk/callback',
    passport.authenticate('odesk', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/');
    });

  // google ---------------------------------
  // send to google to do the authentication
  app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

  // the callback after google has authenticated the user
  app.get('/auth/google/callback',
    passport.authenticate('google', {
      successRedirect : HOME,
      failureRedirect : LOGIN
    }), function(req, res) {
    });

  // google for users who have already linked their account
  app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

  // the callback after google has authorized the user
  app.get('/connect/google/callback',
    passport.authorize('google', {
      successRedirect : HOME,
      failureRedirect : LOGIN
    }));


  app.get('/auth/odesk', passport.authenticate('odesk'));

  app.get('/auth/odesk/callback',
    passport.authenticate('odesk', {
      failureRedirect: LOGIN
    }), function (req, res) {
      req.session.odesk = req.user;
      res.redirect(HOME);
  });

  // odesk for users who have already linked their account
  app.get('/connect/odesk', passport.authorize('odesk'));

  // the callback after google has authorized the user
  app.get('/connect/odesk/callback',
    passport.authorize('odesk', {
      successRedirect : HOME,
      failureRedirect : LOGIN
    }));

}
