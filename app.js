var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cors = require('cors');
const rateLimit = require('express-rate-limit');

var routes = require('./routes/index');
const lmApiProxy = require('./routes/lmapiproxy');
var mapStateRouter = require('./routes/mapstate');
var errors = require('./routes/errors');
var conf = require('./conf/config');

var app = express();

const limiter = rateLimit({
	windowMs: 5 * 60 * 1000, // 5 minutes
	max: 10000, // Limit each IP to 10000 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	keyGenerator: (req, res) => {
    // Client ip without port
    if (!req.ip) {
      console.error('Warning: req.ip is missing!');
      return req.socket.remoteAddress;
    }
    // Find all instances of IPv4 and IPv6 addresses in a string (which can be a comma separated list)
    // and exclude port numbers, if present.
    //
    // \[?                          Matches an optional opening square bracket [
    // ((\d{1,3}\.){3}\d{1,3})      Matches an IPv4 address
    // (([a-f0-9:]+:+)+[a-f0-9]*)   Matches an IPv6 address
    // (\]?[:]{1}\d+)?              Matches an optional closing square bracket ], followed by a colon : and one or more digits (port number)
    return req.ip.matchAll(/\[?(((\d{1,3}\.){3}\d{1,3})|(([a-f0-9:]+:+)+[a-f0-9]*))(\]?[:]{1}\d+)?/gi)
      .toArray() // Get all matches as an array
      .map(e => e[1]) // Extract the first capture group of each match
      .join(','); // Reassemble all matching IPs to a comma separated list without port numbers
  }
})

// apply rate limiter to all requests
app.use(limiter);

var server = app.listen(3001, function () {
  var host = server.address().address
  var port = server.address().port

  console.log('Origo server listening at http://%s:%s', host, port)
});

//Workaround to set __dirname properly when using node-windows
process.chdir(__dirname);

var handlebars = require('express-handlebars')
    .create({ defaultLayout: 'main', helpers: {
      eq: function (v1, v2) { return v1 === v2; },
      ne: function (v1, v2) { return v1 !== v2; },
      lt: function (v1, v2) { return v1 < v2; },
      gt: function (v1, v2) { return v1 > v2; },
      lte: function (v1, v2) { return v1 <= v2; },
      gte: function (v1, v2) { return v1 >= v2; },
      and: function () { return Array.prototype.every.call(arguments, Boolean); },
      or: function () { return Array.prototype.slice.call(arguments, 0, -1).some(Boolean); }
    }});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));
if (conf['trustProxy']) {
  app.set('trust proxy', true);
}

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.json({limit: "5mb"}));
app.use(bodyParser.urlencoded({limit: "5mb", extended: true, parameterLimit:50000}));
app.use(express.json({limit: '5mb'}));
app.use(express.urlencoded({limit: '5mb', extended: true, parameterLimit:50000}));
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
if (conf['lmapiproxy']) {
  conf['lmapiproxy'].forEach(proxyAppConfig => app.use(`/lmap/${proxyAppConfig.id}`, lmApiProxy(proxyAppConfig)));
}
app.use(errors);

module.exports = app;
