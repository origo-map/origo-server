var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var mapStateRouter = require('./routes/mapstate');

var app = express();

var server = app.listen(3001, function () {
  var host = server.address().address
  var port = server.address().port

  console.log('Origo server listening at http://%s:%s', host, port)
});

//Workaround to set __dirname properly when using node-windows
process.chdir(__dirname);

var handlebars = require('express-handlebars')
    .create({defaultLayout: 'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/origoserver/', routes);
app.use('/mapstate', mapStateRouter);

// error handlers

// 404 catch-all handler (middleware)
app.use(function(req, res, next) {
    res.status(404);
    res.render('404');
});

// 500 error handler (middleware)
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500);
    res.render('500');
});


module.exports = app;
