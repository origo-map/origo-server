var conf = require('../conf/config');
var request = require('request');
var rp = require('request-promise');
var transformCoordinates = require('../lib/utils/transformcoordinates');
//var Promise = require('bluebird');

var objectIds;
var username;
var password;
var srid;
var validProjs = ["3006", "3007", "3008", "3009", "3010", "3011", "3012", "3013", "3014", "3015", "3016", "3017", "3018", "3857", "4326"];

// Token holder
let token;
let scope;
var proxyUrl = 'lmelevation';

// Do the request in proper order
const lmElevation = async (req, res) => {

  if (conf[proxyUrl]) {
    configOptions = Object.assign({}, conf[proxyUrl]);
    scope = configOptions.scope;

    // Get a token from LM
    await getTokenAsyncCall(configOptions.consumer_key, configOptions.consumer_secret, configOptions.scope);

    // Do a POST with all the IDs from free search to get the complete objects with geometry
    await doGetAsyncCall(req, res, configOptions, proxyUrl);

  }
}

// Export the module
module.exports = lmElevation;

function getTokenWait(options) {
  // Return promise to be invoked for authenticating on service requests
  return new Promise((resolve, reject) => {
      // Requesting the token service object
      request(options, (error, response, body) => {
          if (error) {
            console.log('Error token:' + error);
            reject('An error occured collecting token: ', error);
          } else {
            token = body.access_token;
            // console.log('Got token ' + token);
            resolve(body.access_token);
          }
      })
  })
}

async function getTokenAsyncCall(consumer_key, consumer_secret, scope) {
  // Request a token from Lantmateriet API
  const options = {
      url: configOptions.url_token,
      method: 'POST',
      headers: {
         'Authorization': 'Basic ' + Buffer.from(consumer_key + ':' + consumer_secret).toString('base64')
      },
      form: {
          'scope': scope,
          'grant_type': 'client_credentials'
      },
      json: true
  }
  var result = await getTokenWait(options);
  return result;
}

function doGetWait(req, res, options) {
  rp(options)
  .then(function (parsedBody) {
    // Send the resulting object as json and end response
    if (srid === '3006') {
      res.send(parsedBody);
    } else {
      res.send(concatResult(parsedBody, srid));
    }
  })
  .catch(function (err) {
    console.log(err);
    console.log('ERROR doGetWait!');
    res.send([]);
  });
}

async function doGetAsyncCall(req, res, configOptions, proxyUrl) {
  var xcoord;
  var ycoord;
  var urlArr;

  urlArr = req.url.split('/');
  srid = decodeURI(urlArr[3]);
  xcoord = decodeURI(urlArr[4]);
  ycoord = decodeURI(urlArr[5]);
  // Check so that not request parameters have been added to ycoord which can happen when the end slash is missing.
  if (ycoord.includes('?')) {
    ycoord = ycoord.substring(0, ycoord.indexOf('?'));
  }
  // Check that request url has numbers
  if (isNaN(srid) || isNaN(xcoord) || isNaN(ycoord) ) {
    console.log('ERROR Request parameters not numbers!');
    res.send({});
  } else {
    // Check that crs is one of the defined
    if ( !validProjs.includes(srid) ) {
      console.log('ERROR Wrong crs input, must be between 3006 and 3018 or 3857, 4326!');
      res.send({});
    } else {
      if (srid !== '3006') {
        var newCoordinates = transformCoordinates(srid, '3006', [Number(xcoord), Number(ycoord)]);
        xcoord = newCoordinates[0];
        ycoord = newCoordinates[1];
      }

      // Setup the search call and wait for result
      const options = {
          url: encodeURI(configOptions.url + '/hojd/3006/' + xcoord + '/' + ycoord + '/'),
          method: 'GET',
          headers: {
            'content-type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'scope': `${scope}`
          },
          json: true // Automatically parses the JSON string in the response
      }

      await doGetWait(req, res, options);
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
