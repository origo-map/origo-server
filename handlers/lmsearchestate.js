var conf = require('../conf/config');
var lmGetEstate = require('../handlers/lmgetestate');
var request = require('request');
var rp = require('request-promise');
var Bluebird = require('bluebird');
const url = require('url');

var objectIds;
var fnrObjektidentitet;
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
fnrObjektidentitet = '';

// Do the request in proper order
const lmSearchEstate = async (req, res) => {

  if (conf[proxyUrl]) {
    configOptions = Object.assign({}, conf[proxyUrl]);
    scope = configOptions.scope;

    // Get a token from LM
    await getTokenAsyncCall(configOptions.consumer_key, configOptions.consumer_secret, configOptions.scope);

    // Get the query parameters from the url
    const parsedUrl = url.parse(decodeURI(req.url), true);
    if ('srid' in parsedUrl.query) {
      srid = parsedUrl.query.srid;
    } else {
       srid = '3006';
    }
    const pathFnrRegEx = /registerenheter\/[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}\/enhetsomraden/i;
    let found = req.url.match(pathFnrRegEx);
    if (found !== null) {
      // Check if enhetsomraden is requested and divert to that module
      const indexStart = req.url.indexOf('/registerenheter/') + 17;
      const indexEnd = req.url.indexOf('/enhetsomraden');
      const fnr = req.url.substring(indexStart, indexEnd);
      req.url = req.url + '&fnr=' + fnr;
      lmGetEstate(req, res);
    } else if ('fnr' in parsedUrl.query) {
      // Check if fnr is included in parameters is requested and divert to that get estate module
      lmGetEstate(req, res);
    } else if ('x' in parsedUrl.query) {
      // Check if x is included in parameters is requested and then get estate name
      const x = parsedUrl.query.x;
      const y = parsedUrl.query.y;

      // Get a token from LM
      await getTokenAsyncCall(configOptions.consumer_key, configOptions.consumer_secret, configOptions.scope);

      // Do a POST with all the IDs from free search to get the complete objects with geometry
      await doGetFromPointAsyncCall(req, res, configOptions, x, y);
    } else if ('q' in parsedUrl.query) {
      const searchString = parsedUrl.query.q;
      var searchArray = searchString.split(' ');
      var municipality = searchArray[0];
      var municipalityArray = municipality.split(',');
      var index;
      var searchValue = '';
      for (index = 0; index < searchArray.length; ++index) {
        if (index == 1) {
          searchValue = searchArray[index];
        } else if (index > 1) {
          searchValue = searchValue + ' ' + searchArray[index];
        }
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
      await doSearchAsyncCall(municipalityArray, searchValue);

      // Allow a maximum of 250 objects
      objectIds.length = objectIds.length > 250 ? 250 : objectIds.length;

      // Do a POST with all the IDs from free search to get the complete objects with geometry
      await getEstateAsyncCall(req, res);
      // Reset the array of found objects.
      objectIds = [];
    } else {
      res.send([]);
    }
  }
}

// Do the request in proper order
const lmGetEstateFromPoint = async (req, res) => {

  if (conf[proxyUrl]) {
    configOptions = Object.assign({}, conf[proxyUrl]);
    scope = configOptions.scope;
    const parsedUrl = url.parse(decodeURI(req.url), true);
    if ('srid' in parsedUrl.query) {
      srid = parsedUrl.query.srid;
    } else {
       srid = '3006';
    }
    if ('x' in parsedUrl.query) {
      const x = parsedUrl.query.x;
      const y = parsedUrl.query.y;
      // Get a token from LM
      await getTokenAsyncCall(configOptions.consumer_key, configOptions.consumer_secret, configOptions.scope);

      // Do a POST with all the IDs from free search to get the complete objects with geometry
      await doGetEstateNumberAsyncCall(configOptions, x, y);

      if (typeof fnrObjektidentitet === 'undefined') {
        // fnr is undefined do nothing
      } else {
        if (typeof fnrObjektidentitet !== '') {
          req.url = req.url + '&fnr=' + fnrObjektidentitet;
          lmGetEstate(req, res);
        }
      }
    } else {
      res.send({});
    }
  } else {
    res.send({});
  }
  fnrObjektidentitet = '';
}

// Export the module
module.exports = {
  lmSearchEstate,
  lmGetEstateFromPoint
};

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

async function doSearchAsyncCall(municipalityArray, searchValue) {
  var returnValue = [];
  var promiseArray = [];
  // Split all the separate municipality given to individual searches
  municipalityArray.forEach(function(municipality) {
    var searchUrl = encodeURI(configOptions.url + '/referens/fritext/' + municipality + ' ' + searchValue + '?status=' + status + '&maxHits=' + maxHits)
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
    promiseArray.push(rp.get(options)
      .then(function(result) {
        var parameters = JSON.parse(result);
        var beteckningsid = [];

        parameters.forEach(function(parameter) {
          if (parameter.beteckningsid) {
            beteckningsid.push(parameter.beteckningsid);
          }
        });
        return beteckningsid;
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
        objectIds = [];
    })
    .finally(function () {
        // When all search has finished concat them to a single array of object Ids
        var newArray = [];
        returnValue.forEach(function(search) {
          newArray = newArray.concat(search);
        });
        objectIds = newArray;
    });
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
    res.send([]);
  });
}

async function getEstateAsyncCall(req, res) {
  if (objectIds.length > 0) {
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
    getEstateWait(options, res);
  } else {
    console.log('No objects!');
    res.send({});
  }
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

    // Only show those that has coordinates
    if (coordinates.length !== 0) {
      result.push(object);
    }
  })

  return result;
}

function doGetFromPointWait(req, res, options) {
  rp(options)
  .then(function (parsedBody) {
    res.send(concatEstateNameResult(parsedBody));
  })
  .catch(function (err) {
    console.log(err);
    console.log('ERROR doGetFromPointWait!');
    res.send({});
  });
}

async function doGetFromPointAsyncCall(req, res, configOptions, easting, northing) {
  // Setup the search call and wait for result
  const options = {
      url: encodeURI(configOptions.url + '/punkt/' + srid + '/' + northing + ',' + easting + '?srid=' + srid),
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'scope': `${scope}`
      },
      json: true // Automatically parses the JSON string in the response
  }

  await doGetFromPointWait(req, res, options);
}

function concatEstateNameResult(feature) {
  const result = {};
  let fastighet = '';

  if ('features' in feature) {
    feature.features.forEach((element) => {
      const registeromrade = element.properties.registerbeteckning.registeromrade;
      const beteckning = element.properties.registerbeteckning.trakt;
      const block = element.properties.registerbeteckning.block ;
      const enhet = element.properties.registerbeteckning.enhet;
      //const objektidentitet = element.properties.registerenhetsreferens.objektidentitet;

      switch (block) {
        case '*':
          fastighet = registeromrade + ' ' + beteckning + ' ' + enhet;
          break;
        default:
          fastighet = registeromrade + ' ' + beteckning + ' ' + block + ':' + enhet;
      }
    })
  }

  result['name'] = fastighet;

  return result;
}

async function doGetEstateNumberAsyncCall(configOptions, easting, northing) {
  var returnValue = [];
  var promiseArray = [];

  // Setup the search call and wait for result
  const options = {
      url: encodeURI(configOptions.url + '/punkt/' + srid + '/' + northing + ',' + easting + '?srid=' + srid),
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'scope': `${scope}`
      },
      json: true // Automatically parses the JSON string in the response
  }

  promiseArray.push(rp(options)
    .then(function (parsedBody) {
      concatEstateNumberResult(parsedBody);
    })
    .catch(function (err) {
      console.log(err);
      console.log('ERROR doGetEstateNumberWait!');
    })
  )

  await Promise.all(promiseArray)
    .then(function (returnValue) {
        // The result has been handled in concatEstateNumberResult()
    })
    .catch(function (err) {
        // If fail return empty array
        fnrObjektidentitet = '';
    })
    .finally(function () {
        // The result has been handled in concatEstateNumberResult()
    });
}

function concatEstateNumberResult(feature) {
  const result = {};

  if ('features' in feature) {
    feature.features.forEach((element) => {
      fnrObjektidentitet = element.properties.registerenhetsreferens.objektidentitet;
    })
  }
}
