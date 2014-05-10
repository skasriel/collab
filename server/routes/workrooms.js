var mongo = require('mongodb');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('workplacedb', server);

db.open(function(err, db) {
    if(!err) {
        console.log("Connected to 'workplacedb' database");
        db.collection('workrooms', {strict:true}, function(err, collection) {
            if (err) {
                console.log("The 'workrooms' collection doesn't exist. Creating it with sample data...");
                populateDB();
                console.log("... Done populating");
            }
        });
    }
});

exports.findById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving workroom: ' + id);
    db.collection('workrooms', function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
            res.send(item);
        });
    });
};

exports.findAll = function(req, res) {
    db.collection('workrooms', function(err, collection) {
        collection.find().toArray(function(err, items) {
            res.send(items);
        });
    });
};

exports.addWorkroom = function(req, res) {
    var workRoom = req.body;
    console.log('Adding workroom: ' + JSON.stringify(workRoom));
    db.collection('workrooms', function(err, collection) {
        collection.insert(workRoom, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
                res.send(result[0]);
            }
        });
    });
}

exports.updateWorkroom = function(req, res) {
    var id = req.params.id;
    var workroom = req.body;
    console.log('Updating workroom: ' + id);
    console.log(JSON.stringify(workroom));
    db.collection('workrooms', function(err, collection) {
        collection.update({'_id':new BSON.ObjectID(id)}, workroom, {safe:true}, function(err, result) {
            if (err) {
                console.log('Error updating workroom: ' + err);
                res.send({'error':'An error has occurred'});
            } else {
                console.log('' + result + ' document(s) updated');
                res.send(workroom);
            }
        });
    });
}

exports.deleteWorkroom = function(req, res) {
    var id = req.params.id;
    console.log('Deleting workroom: ' + id);
    db.collection('workrooms', function(err, collection) {
        collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred - ' + err});
            } else {
                console.log('' + result + ' document(s) deleted');
                res.send(req.body);
            }
        });
    });
}

/*--------------------------------------------------------------------------------------------------------------------*/
// Populate database with sample data -- Only used once: the first time the application is started.
// You'd typically not find this code in a real-life app, since the database would already exist.
var populateDB = function() {

    var workrooms =
    [
        {
            "name": "general",
            "numMessages": "100"
        },

        {
            "name": "random",
            "numMessages": "1230"
        },

        {
            "name": "product",
            "numMessages": "33"
        },

      {
          "name": "engineering",
          "numMessages": "73"
      }
    ];

    db.collection('workrooms', function(err, collection) {
        collection.insert(workrooms, {safe:true}, function(err, result) {});
    });

};
