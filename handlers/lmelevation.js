var conf = require('../conf/config');
var request = require('request');
var rp = require('request-promise');
var transformCoordinates = require('../lib/utils/transformCoordinates');
//var Promise = require('bluebird');

var objectIds;
var username;
var password;
var srid;
var validProjs = ["3006", "3007", "3008", "3009", "3010", "3011", "3012", "3013", "3014", "3015", "3016", "3017", "3018", "3857", "4326"];

module.exports = function lmProxy(req, res) {
  var proxyUrl = 'lmelevation';
  var options;
  objectIds = [];

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  if (conf[proxyUrl]) {
    options = Object.assign({}, conf[proxyUrl]);

    prepareRequest(req, res, options, proxyUrl);
  }
}

function prepareRequest(req, res, options, proxyUrl) {
  var buckets;
  var srid;
  var xcoord;
  var ycoord;
  var urlArr;
  username = options.auth.user;
  password = options.auth.pass;

  buckets = decodeURI(req.url.split(proxyUrl));
  urlArr = req.url.split('/');
  srid = decodeURI(urlArr[2]);
  xcoord = decodeURI(urlArr[3]);
  ycoord = decodeURI(urlArr[4]);

  // Check that request url has numbers
  if (isNaN(srid) || isNaN(xcoord) || isNaN(ycoord) ) {
    res.send({ error: 'Request parameters not numbers' });
  } else {
    // Check that crs is one of the defined
    if ( !validProjs.includes(srid) ) {
      res.send({ error: 'Wrong crs input, must be between 3006 and 3018 or 3857, 4326' });
    } else {
      if (srid !== '3006') {
        var newCoordinates = transformCoordinates(srid, '3006', [Number(xcoord), Number(ycoord)]);
        xcoord = newCoordinates[0];
        ycoord = newCoordinates[1];
      }
      var optionsRP = {
          uri: encodeURI(options.url + '/hojd/3006/' + xcoord + '/' + ycoord + '/'),
          headers: {
            'User-Agent': 'Origoserver',
            'content-type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(username + ':' + password).toString('base64')
          },
          json: true // Automatically parses the JSON string in the response
      };

      rp(optionsRP)
      .then(function (parsedBody) {
        if (srid === '3006') {
          res.send(parsedBody);
        } else {
          res.send(concatResult(parsedBody, srid));
        }
      })
      .catch(function (err) {
        console.log(err);
        res.send(undefined);
        console.log('ERROR1!');
      });
    }
  }
}

function concatResult(feature, toProjection) {
  const result = {};

  const coordinates = feature.geometry.coordinates;
  const nodatavalue = feature.properties.nodatavalue;

  result['type'] = 'Feature';
  result['crs'] = {
    type: 'name',
    properties:  {
      name: 'urn:ogc:def:crs:EPSG::' + toProjection
    }
  };
  result['geometry'] = {
    type: 'Point',
    coordinates: transformCoordinates('3006', toProjection, coordinates)
  };
  result['properties'] = {
    nodatavalue: nodatavalue
  };

  return result;
}
