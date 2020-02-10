var conf = require('../conf/config');
var request = require('request');
var rp = require('request-promise');
var Bluebird = require('bluebird');
const url = require('url');
var getMunicipality = require('../lib/utils/municipality');

var objectIds;
var username;
var password;

// Token holder
let token;
let scope;

var proxyUrl = 'lmsearchplacename';
var configOptions;
var srid = '3006';
objectIds = [];

// Doesn't need the async for now
const lmSearchPlacename = async (req, res) => {

  if (conf[proxyUrl]) {
    configOptions = Object.assign({}, conf[proxyUrl]);

    // Get a token from LM
    await getTokenAsyncCall(configOptions.consumer_key, configOptions.consumer_secret, configOptions.scope);

    const parsedUrl = url.parse(decodeURI(req.url), true);
    var kommunkod = '';
    if ('kommunkod' in parsedUrl.query) {
      kommunkod = parsedUrl.query.kommunkod;
      var kommunkod = parsedUrl.query.kommunkod;
      var municipalityArray = kommunkod.split(',');
      if (municipalityArray.length > 0) {
        var lmuser = parsedUrl.query.lmuser;
        var q = parsedUrl.query.q;
        var page = parsedUrl.query.page;
        var start = parsedUrl.query.start;
        var limit = parsedUrl.query.limit;
        var lang = parsedUrl.query.lang;
        var nametype = parsedUrl.query.nametype;
        if ('srid' in parsedUrl.query) {
          srid = parsedUrl.query.srid;
        } else {
          srid = '3006';
        }
        if ('matchtype' in parsedUrl.query) {
          matchtype = parsedUrl.query.matchtype;
        } else {
          matchtype = 'contains';
        }
        var searchUrl = '/kriterier?';

        if ( q.length > 0 ) {
          searchUrl = searchUrl + 'namn=' + q + '&match=' + matchtype;
        }
        // Set language for result
        if ( lang ) {
          searchUrl = searchUrl + '&sprak=' + lang;
        }
        // Limit the hits to nametypes
        if ( nametype ) {
          searchUrl = searchUrl + '&namntyp=' + nametype;
        }
        // Get the result based on pages
        if ( limit ) {
          searchUrl = searchUrl + '&maxHits=' + limit;
        }
        searchUrl = searchUrl + '&srid=' + srid;
        doSearchAsyncCall(req, res, municipalityArray, searchUrl);
      } else {
        console.log('Skip');
        res.send({});
      }
    } else {
      console.log('Skip');
      res.send({});
    }
  }
}

// Export the module
module.exports = lmSearchPlacename;

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

async function doSearchAsyncCall(req, res, municipalityArray, urlParams) {
  var returnValue = [];
  var promiseArray = [];
  // Split all the separate municipality given to individual searches
  municipalityArray.forEach(function(municipality) {
    var searchUrl = encodeURI(configOptions.url + urlParams + '&kommunkod=' + municipality)
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
    promiseArray.push(
      rp(options)
      .then(function (result) {
        var parameters = JSON.parse(result);
        var newRes = [];
        newRes = concatResult(parameters.features, municipality);
        return newRes;
      })
      .catch(function (err) {
        console.log(err);
        console.log('ERROR doSearchAsyncCall!');
        res.send({});
      })
    )
  });

  await Promise.all(promiseArray)
    .then(function (resArr) {
        // Save the response to be handled in finally
        returnValue = resArr;
    })
    .catch(function (err) {
        // If fail return empty array
        res.send([]);
    })
    .finally(function () {
        // When all search has finished concat them to a single array of object Ids
        var newArray = [];
        returnValue.forEach(function(search) {
          newArray = newArray.concat(search);
        });
        res.send(newArray);
    });
}

function concatResult(placenames, municipality) {
  const result = [];

  // Check to see if there are multiple hits or a single
  if (Array.isArray(placenames)) {
    placenames.forEach((placename) => {
      result.push(getOrtnamn(placename, municipality));
    })
  } else {
    if (typeof placenames === 'undefined') {
      // placenames is undefined do nothing
    } else {
      result.push(getOrtnamn(placenames, municipality));
    }
  }
  return result;
}

function getOrtnamn(placename, municipality) {
  const id = placename.id;
  const namn = placename.properties.namn;
  let lanskod = '';
  let kommunkod = '';
  let kommunnamn = '';
  let coordinatesNE = [];
  // Check to see if feature has none or multiple coordinates
  if ('placering' in placename.properties) {
    // OBS! If there is a multipoint in the response it only uses the first coordinates
    const coordinates = placename.properties.placering[0].punkt.coordinates;
    coordinatesNE.push([coordinates[1], coordinates[0]]);
    lanskod = placename.properties.placering[0].lankod;
    kommunkod = placename.properties.placering[0].kommunkod;
    kommunnamn = placename.properties.placering[0].kommunnamn;
  }
  // If the kommunkod wasn't supplied in request get the municipality from the response
  if (municipality.countyCode === '00') {
    municipality = getMunicipality(lanskod.padStart(2, '0')+kommunkod.padStart(2, '0'));
  }

  // Build the object to return
  let object = {};
  if (coordinatesNE.length !== 0) {
    if (coordinatesNE.length === 1) {
      object['geometry'] = {
        coordinates: coordinatesNE[0],
        type: 'Point'
      };
    } else {
      object['geometry'] = {
        coordinates: coordinatesNE,
        type: 'MultiPoint'
      };
    }
  }
  object['properties'] = {
      id: id,
      name: namn,
      municipality: kommunnamn
  };
  object['type'] = 'Feature';

  return object;
}
