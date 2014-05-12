var passport = require('passport'),
    User = require('./models/user'),
    Workroom = require('./models/workroom'),
    Message = require('./models/message');

var HOME = '/app/main.html'
module.exports = function (app) {
  function IsAuthenticated(req,res,next) {
    if(req.isAuthenticated()){
        next();
    }else{
      console.log("Not authorized "+req);
        next(new Error(401));
    }
  }

  // User registration & login
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
      //          User.register(user, req.body.password, function(err, account) {
          console.log("error? registering user: "+err+" user: "+account);
          if (err) {
              return res.redirect('/app/register.html');
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
      res.redirect('/app/register.html');
  });


  // test api
  app.get('/api', function (req, res) {
    res.send('Workplace API is running');
  });

  // Returns the active user (for display next to logout link)
  app.get('/api/active_user', IsAuthenticated, function (req, res) {
    console.log("GET /api/active_user. User is: "+req.user.username);
    return res.send(req.user.username);
  });

  // List workrooms
  app.get('/api/workrooms', IsAuthenticated, function (req, res) {
    console.log("GET /api/workrooms. User is: "+req.user.username);
    return Workroom
      .find() //TODO: show this user's workrooms only //{req.user: { $in: workroom.users} })
      .sort("name")
      .exec(function (err, workrooms) {
        if (err) return console.log(err);
        // inefficient, but works for now: return the subset of rooms that this user has access to
        var allowed = new Array();
        console.log("Checking access to: "+workrooms.length+" workrooms");
        for(i=0; i<workrooms.length; i++) {
          var room = workrooms[i];
          var roomUsers = room.users;
          if (!roomUsers) continue;
          for (j=0; j<roomUsers.length; j++) {
            var roomUser = roomUsers[j];
            if (req.user._id.equals(roomUser)) {
              console.log("user match: "+roomUser);
              allowed.push(room);
              continue;
            }
          }
        }
        console.log("returns: "+allowed.length+" allowed rooms from a total of "+workrooms.length);
        return res.send(allowed);
      });
  });

  // Add a new workroom
  app.post('/api/workrooms', IsAuthenticated, function (req, res) {
    console.log("POST /api/workrooms. User is: "+req.user);
    console.log(req.body);

    var user = User.findById(req.user, function(err, user) {
      if (err) return console.log(err);
      var workroom = new Workroom({
        name: req.body.name,
        messages: [],
        users: [user]
      });
      workroom.save(function (err) {
        if (!err) {
          return console.log("created workroom!" + workroom);
        } else {
          return console.log(err);
        }
      });
      return res.send(workroom);
    });
  });


  var additionalParams = function() {
    name='';
    function toString()
    {
      console.log("toString called!");
      return '"name: "+name';
    }
  };

  // Get messages for a room
  app.get('/api/workrooms/:id/messages', IsAuthenticated, function (req, res) {
    console.log("in /api/workrooms/:id/messages "+req.params.id);
    var room = Workroom.findById(req.params.id, function (err, workroom) {
      if (err) return console.log(err);
      console.log("looking up message(s): "+workroom.messages);
      var messages = Message
        .find({'_id': { $in: workroom.messages} })
        .exec(
        function (err, messages) {
          if (err) return console.log(err);
          // return additional params (e.g. room name) before returning message list
          var roomname = new additionalParams();
          roomname.name = workroom.name;
          messages.unshift(roomname); //return workroom name first
          console.log("returning message list: "+messages.length+" "+messages);
          return res.send(messages);
        });
    });
    return room;
  });



  // Post a message to a workroom
  app.post('/api/workrooms/:id/messages', IsAuthenticated, function (req, res) {

    console.log("POST /api/workrooms/:id/messages "+req.params.id);
    var room = Workroom.findById(req.params.id, function (err, workroom) {
      if (err) return console.log(err);
      var message = new Message(
        {'html': req.body.html,
        'author': req.user._id,
        'author_name': req.user.username}
      );
      console.log("current messages: "+workroom.messages+" "+workroom.messages.length);
      workroom.messages.push(message);
      message.save();
      workroom.save();
      console.log("Posted: "+message);
      return res.send(message);
    });
  });



  // Get users for a room
  app.get('/api/workrooms/:id/users', IsAuthenticated, function (req, res) {
    console.log("in /api/workrooms/:id/users "+req.params.id);
    var room = Workroom.findById(req.params.id, function (err, workroom) {
      if (err) {
        console.log("looking up users(s): "+workroom.users);
        return next(new Error(401));
      }

      /*
      //username: {type: String, required: true, validate: [/[a-zA-Z0-9]/, 'user names should only have letters and numbers']},
      firstname: {type: String, required: false},
      lastname: {type: String, required: false},
      displayname: {type: String, required: false}

      */
      var users = User.find({'_id': { $in: workroom.users} })
      .select('username displayname _id')
      .exec(
      function (err, users) {
        if (err) {
          console.log(err);
          return next(new Error(401));
        }
        console.log("returning user list: "+users+" "+users.length);
        console.log("first user: "+users[0]);
        return res.send(users);
      });
    });
    return room;
  });

  // Invite a user to a room
  app.post('/api/workrooms/:id/users', IsAuthenticated, function (req, res) {
    var inviteUserName = req.body.inviteUserName;
    console.log("POST /api/workrooms/:id/users "+req.params.id+" "+inviteUserName);
    var room = Workroom.findById(req.params.id, function (err, workroom) {
      if (err) return console.log(err);
      var inviteUser = User.find('username': {$in: inviteUserName}, function(err, inviteUser) {
        if (err) return console.log(err);
        var users = room.users;
        if (users.contains(inviteUser._id)) {
          console.log("user "+inviteUser+" is already in workroom "+room.name);
          return res.send(room);
        }
        users.push(inviteUser._id);
        workroom.save();
        console.log("Users in workroom: "+room.name+" are now: "+room.users.length+" "+room.users);
        return res.send(room);
      }
    });
  });

  // PUT to UPDATE

  // Bulk update
  /*app.put('/api/products', function (req, res) {
      var i, len = 0;
      console.log("is Array req.body.products");
      console.log(Array.isArray(req.body.products));
      console.log("PUT: (products)");
      console.log(req.body.products);
      if (Array.isArray(req.body.products)) {
          len = req.body.products.length;
      }
      for (i = 0; i < len; i++) {
          console.log("UPDATE product by id:");
          for (var id in req.body.products[i]) {
              console.log(id);
          }
          ProductModel.update({ "_id": id }, req.body.products[i][id], function (err, numAffected) {
              if (err) {
                  console.log("Error on update");
                  console.log(err);
              } else {
                  console.log("updated num: " + numAffected);
              }
          });
      }
      return res.send(req.body.products);
  });

  // Single update
  app.put('/api/products/:id', function (req, res) {
    return ProductModel.findById(req.params.id, function (err, product) {
      product.title = req.body.title;
      product.description = req.body.description;
      product.style = req.body.style;
      product.images = req.body.images;
      product.categories = req.body.categories;
      product.catalogs = req.body.catalogs;
      product.variants = req.body.variants;
      return product.save(function (err) {
        if (!err) {
          console.log("updated");
        } else {
          console.log(err);
        }
        return res.send(product);
      });
    });
  });
  */


  /*// Bulk destroy all products
  app.delete('/api/products', function (req, res) {
    ProductModel.remove(function (err) {
      if (!err) {
        console.log("removed");
        return res.send('');
      } else {
        console.log(err);
      }
    });
  });

  // remove a single product
  app.delete('/api/products/:id', function (req, res) {
    return ProductModel.findById(req.params.id, function (err, product) {
      return product.remove(function (err) {
        if (!err) {
          console.log("removed");
          return res.send('');
        } else {
          console.log(err);
        }
      });
    });
  });
  */
};
