var conf = require('../conf/config');
var axios = require('axios');
const lmtokenhandler = require('./lmtokenhandler');
var transformCoordinates = require('../lib/utils/transformcoordinates');

var srid = '3006';
var validProjs = ["3006", "3007", "3008", "3009", "3010", "3011", "3012", "3013", "3014", "3015", "3016", "3017", "3018", "3857", "4326"];

var confObj = 'lmelevation';

/**
 * Main function to process elevation requests.
 * Handles token retrieval and directing request handling based on method (GET/POST).
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
const lmElevation = async (req, res) => {
  if (conf[confObj]) {
    const config = Object.assign({}, conf[confObj]);
    try {
      // Retrieve access token from Lantmäteriet using the helper module for token handling
      const tokenObject = await lmtokenhandler({
        id: confObj,
        url_token: config.url_token,
        url_revoke: config.url_revoke,
        consumer_key: config.consumer_key,
        consumer_secret: config.consumer_secret,
        scope: config.scope
      });
      // Process GET or POST requests for elevation data
      await doGetAsyncCall(req, res, config, tokenObject.token);
    } catch (error) {
      console.log('Error:', error);
      res.status(500).send({ 'error': error.message });
    }

  }
}

/**
 * Do get Z value for single coordinate
 * 
 * @function
 * @name doGetWait
 * @kind function
 * @param {any} req - The HTTP request object.
 * @param {any} res - The HTTP response object.
 * @param {any} options - The config otions for the axios request.
 * @returns {void}
 */
function doGetWait(req, res, options) {
  axios(options)
  .then(response => {
    const parsedBody = response.data;
    if (srid === '3006') {
      res.send(parsedBody);
    } else {
      res.send(reProject(parsedBody, srid));
    }
  })
  .catch(function (err) {
    console.error('ERROR doGetWait!', err.message);
    res.status(500).send({ 'error': err.message });
  });
}

/**
 * Do post a GeoJSON geometry and respond with the geometry with Z values
 * 
 * @function
 * @name doGetGeoemtryWait
 * @kind function
 * @param {any} req - The HTTP request object.
 * @param {any} res - The HTTP response object.
 * @param {any} options - The config otions for the axios request.
 * @returns {void}
 */
function doGetGeoemtryWait(req, res, options) {
  axios(options)
  .then(response => {
    const parsedBody = response.data;
    if (srid === '3006') {
      res.send(parsedBody);
    } else {
      res.send(reProject(parsedBody, srid, 'LineString'));
    }
  })
  .catch(function (err) {
    console.error('ERROR doGetGeoemtryWait!', err.message);
    res.status(500).send({ 'error': err.message });
  });
}

/**
 * Handles elevation data requests, transforming coordinates as necessary and making API calls.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {Object} configOptions - Configuration options for the API.
 * @param {string} token - Authorization token for the API.
 */
async function doGetAsyncCall(req, res, configOptions, token) {
  var xcoord;
  var ycoord;
  var urlArr;

  // Extracting coordinates and srid from the URL
  urlArr = req.url.split('/');
  if (urlArr[3] !== '') {
    srid = decodeURI(urlArr[3]);
  }
  xcoord = decodeURI(urlArr[4]);
  ycoord = decodeURI(urlArr[5]);
  // Check so that not request parameters have been added to ycoord which can happen when the end slash is missing.
  if (ycoord.includes('?')) {
    ycoord = ycoord.substring(0, ycoord.indexOf('?'));
  }
  // POST: Processing posted geometry to get elevation data
  if (req.method == 'POST') { // A geometry was posted so sed it to API to get its Z values
    let bodyContent = req.body;
    // Re-project coordinates if necessary
    if (srid !== '3006') {
      const newCoordinates = [];
      bodyContent.coordinates.forEach((coord) => {
        newCoordinates.push(transformCoordinates(srid, '3006', coord));
      })
      bodyContent.coordinates = newCoordinates;
    }

    // Setup the search call and wait for result
    const options = {
        url: encodeURI(configOptions.url + '/hojd'),
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'scope': `${configOptions.scope}`,
          'Accept': `application/json`
        },
        data: bodyContent
    }
    // Await the geometry processing request
    await doGetGeoemtryWait(req, res, options);
  } else if (isNaN(srid) || isNaN(xcoord) || isNaN(ycoord) ) {  // Check that request url has numbers
    console.log('ERROR Request parameters not numbers!');
    res.send({});
  } else {
    // Check that crs is one of the defined
    if ( !validProjs.includes(srid) ) {
      console.log('ERROR Wrong crs input, must be between 3006 and 3018 or 3857, 4326!');
      res.send({});
    } else {
      // Possibly perform coordinate re-projection
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
            'scope': `${configOptions.scope}`
          }
      }
      // Await the simple elevation request
      await doGetWait(req, res, options);
    }
  }
}

/**
 * Perform re-projection on GeoJSON
 * 
 * @function
 * @name reProject
 * @kind function
 * @param {any} feature
 * @param {any} toProjection
 * @param {string} type?
 * @returns {{ type: string; crs: { type: string; properties: { name: string; }; }; geometry: { type: string; coordinates: any; } | { type: string; coordinates: any[]; }; properties: { ...; }; }}
 */
function reProject(feature, toProjection, type = '') {
  const result = {};
  let geometryType = 'Point';
  if (type !== '') {
    geometryType = type;
  }
  const coordinates = feature.geometry.coordinates;
  const nodatavalue = feature.properties.nodatavalue;
  result['type'] = 'Feature';
  result['crs'] = {
    type: 'name',
    properties:  {
      name: 'urn:ogc:def:crs:EPSG::' + toProjection
    }
  };
  if (geometryType === 'Point') {
    result['geometry'] = {
      type: geometryType,
      coordinates: transformCoordinates('3006', toProjection, coordinates)
    };
  } else {
    const newCoordinates = [];
    feature.geometry.coordinates.forEach((coord) => {
      newCoordinates.push(transformCoordinates('3006', toProjection, coord));
    })
    result['geometry'] = {
      type: geometryType,
      coordinates: newCoordinates
    };
  }
  result['properties'] = {
    nodatavalue: nodatavalue
  };

  return result;
}

// Export the module
module.exports = lmElevation;