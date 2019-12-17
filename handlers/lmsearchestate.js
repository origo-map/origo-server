var conf = require('../conf/config');
var request = require('request');
var rp = require('request-promise');
const url = require('url');

var objectIds;
var username;
var password;
var srid;
var status;
var maxHits;

// Token holder
let token;
let scope;

var proxyUrl = 'lmsearchestate';
var configOptions;
objectIds = [];

// Do the request in proper order
const lmSearchEstate = async (req, res) => {

  if (conf[proxyUrl]) {
    configOptions = Object.assign({}, conf[proxyUrl]);
    scope = configOptions.scope;

    // Get a token from LM
    await getTokenAsyncCall(configOptions.consumer_key, configOptions.consumer_secret, configOptions.scope);

    // Get the query parameters from the url
    const parsedUrl = url.parse(decodeURI(req.url), true);
    searchString = parsedUrl.query.q;
    if ('srid' in parsedUrl.query) {
      srid = parsedUrl.query.srid;
    } else {
       srid = '3006';
    }
    if ('status' in parsedUrl.query) {
      status = parsedUrl.query.status;
    } else {
      status = 'Gällande';
    }
    if ('maxHits' in parsedUrl.query) {
      maxHits = parsedUrl.query.maxHits;
    } else {
      maxHits = '30';
    }

    // Do a free text search to get the IDs of all that matches
    await doSearchAsyncCall(encodeURI(configOptions.url + '/referens/fritext/' + searchString + '?status=' + status + '&maxHits=' + maxHits));

    // Allow a maximum of 250 objects
    objectIds.length = objectIds.length > 250 ? 250 : objectIds.length;

    // Do a POST with all the IDs from free search to get the complete objects with geometry
    await getEstateAsyncCall(req, res);
    // Reset the array of found objects.
    objectIds = [];
  }
}

// Export the module
module.exports = lmSearchEstate;

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
            console.log('Got token ' + token);
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

function doSearchWait(options) {
  return rp.get(options)
  .then(function(result) {
    var parameters = JSON.parse(result);

    parameters.forEach(function(parameter) {
      if (parameter.beteckningsid) {
        objectIds.push(parameter.beteckningsid);
      }
    });
  })
}

async function doSearchAsyncCall(searchUrl) {
  // Setup the search call and wait for result
  const options = {
      url: searchUrl,
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'scope': `${scope}`
      }
  }
  await doSearchWait(options);
}

function getEstateWait(options, res) {
  rp(options)
  .then(function (parsedBody) {
    // Send the resulting object as json and end response
    res.send(concatResult(parsedBody.features));
  })
  .catch(function (err) {
    console.log(err);
    console.log('ERROR getEstateWait!');
    res.send([{ error: 'getEstateWait' }]);
  });
}

async function getEstateAsyncCall(req, res) {
  // Setup the call for getting the objects found in search and wait for result
  var options = {
    method: 'POST',
    uri: configOptions.url + '/?srid=' + srid,
    body: objectIds,
    headers: {
      'content-type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'scope': `${scope}`
    },
    json: true
  };
  await getEstateWait(options, res);
}

function makeRequest(req, res, options) {
  return rp.get(options)
  .then(function(result) {
    var parameters = JSON.parse(result);

    parameters.forEach(function(parameter) {
      if (parameter.beteckningsid) {
        objectIds.push(parameter.beteckningsid);
      }
    });
  })
}

function concatResult(features) {
  const result = [];

  features.forEach((feature) => {
    const objektidentitet = feature.properties.registerenhetsreferens.objektidentitet;
    const registeromrade = feature.properties.registerbeteckning.registeromrade;
    const beteckningsid = feature.properties.registerbeteckning.beteckningsid;
    const beteckning = feature.properties.registerbeteckning.trakt;
    const block = feature.properties.registerbeteckning.block ;
    const enhet = feature.properties.registerbeteckning.enhet;
    let coordinates = [];
    // Check to see if feature has none or multiple coordinates
    if ('enhetsomrade' in feature.properties.registerenhetsreferens) {
      feature.properties.registerenhetsreferens.enhetsomrade.forEach((enhetsomrade) => {
        if ('centralpunkt' in enhetsomrade) {
          coordinates.push(enhetsomrade.centralpunkt.coordinates);
        }
      })
    }

    // Build the object to return
    let object = {};
    let fastighet = '';
    switch (block) {
      case '*':
        fastighet = registeromrade + ' ' + beteckning + ' ' + enhet;
        break;
      default:
        fastighet = registeromrade + ' ' + beteckning + ' ' + block + ':' + enhet;
    }
    if (coordinates.length !== 0) {
      if (coordinates.length === 1) {
        object['geometry'] = {
          coordinates: coordinates,
          type: 'Point'
        };
      } else {
        object['geometry'] = {
          coordinates: coordinates,
          type: 'MultiPoint'
        };
      }
    }
    object['properties'] = {
        name: fastighet,
        objid: objektidentitet,
        fnr: beteckningsid
    };
    object['type'] = 'Feature';

    result.push(object);
  })

  return result;
}
