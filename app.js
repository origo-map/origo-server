var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cors = require('cors')

var routes = require('./routes/index');
var mapStateRouter = require('./routes/mapstate');
var errors = require('./routes/errors');
var conf = require('./conf/config');

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
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
if (conf['cors']) {
  var configOptions = Object.assign({}, conf['cors']);
  var corsOptions = {};
  // Configures the Access-Control-Allow-Origin CORS header.
  if ('origin' in configOptions) {
    corsOptions['origin'] = configOptions.origin;
  }
  // Configures the Access-Control-Allow-Methods CORS header.
  if ('methods' in configOptions) {
    corsOptions['methods'] = configOptions.methods;
  }
  // Configures the Access-Control-Allow-Headers CORS header.
  if ('headers' in configOptions) {
    corsOptions['allowedHeaders'] = configOptions.headers;
  }
  // Configures the Access-Control-Allow-Credentials CORS header.
  if ('credentials' in configOptions) {
    corsOptions['credentials'] = configOptions.credentials;
  }
  // Some legacy browsers (IE11, various SmartTVs) choke on 204
  if ('optionsSuccessStatus' in configOptions) {
    corsOptions['optionsSuccessStatus'] = configOptions.optionsSuccessStatus;
  }
  app.use(cors(corsOptions));
}

app.use('/origoserver/', routes);
app.use('/mapstate', mapStateRouter);
app.use(errors);

module.exports = app;
