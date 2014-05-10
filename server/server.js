var application_root = __dirname;

var express = require('express'),
    workplace = require('./routes/workrooms'),
    path = require("path");

var app = express();

app.configure(function () {
    app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
    app.use(express.static(path.join(application_root, "../")));
});

app.get('/workrooms', workplace.findAll);
app.get('/workrooms/:id', workplace.findById);
//app.get('/workrooms/:id/users', workplace.findUsersById);
app.post('/workrooms', workplace.addWorkroom);
app.put('/workrooms/:id', workplace.updateWorkroom);
app.delete('/workrooms/:id', workplace.deleteWorkroom);

app.listen(3000);
console.log('Listening on port 3000...');
