var conf = require('../conf/config');
var request = require('request');
var rp = require('request-promise');
var transformCoordinates = require('../lib/utils/transformcoordinates');
var query_overpass = require('query-overpass');
const url = require('url');

module.exports = function overpass(req, res) {
  var proxyUrl = 'overpass';
  var options;
  var srid;
  var q;
  // Get the query parameters from the url
  const parsedUrl = url.parse(decodeURI(req.url), true);
  if ('q' in parsedUrl.query) {
    q = parsedUrl.query.q;
  } else {
    q = '';
    console.log('No query specified!');
    res.send({});
  }

  if (conf[proxyUrl]) {
    options = Object.assign({}, conf[proxyUrl]);
    options.queries.forEach((query) => {
      if (q === query.name) {
        doQuery(req, res, query, srid);
      }
    });
  } else {
    console.log('ERROR config!');
    res.send({});
  }
}

function doQuery(request, response, query, srid) {
  // Setup the query call and wait for result
  query_overpass(query.query, function(err, geojson) {
        if (err) {
          console.log(err);
          response.send({});
        }
        response.send(geojson);
    }, query.options)
}
