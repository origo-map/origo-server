var conf = require('../conf/config');
var lmGetEstate = require('../handlers/lmgetestate');
var rp = require('request-promise');
const url = require('url');
const { compareRelevance, compareNamesNaturally } = require('../utils/compare');
const lmtokenhandler = require('./lmtokenhandler');

var proxyUrl = 'lmsearchestate';

// Do the request in proper order
const lmSearchEstate = async (req, res) => {

  if (conf[proxyUrl]) {
    const configOptions = Object.assign({}, conf[proxyUrl]);
    const scope = configOptions.scope;

    // Get a token from LM
    const tokenObject = await lmtokenhandler({
      id: proxyUrl,
      url_token: configOptions.url_token,
      url_revoke: configOptions.url_revoke,
      consumer_key: configOptions.consumer_key,
      consumer_secret: configOptions.consumer_secret,
      scope: configOptions.scope
    });
    const token = tokenObject.token;

    // Get the query parameters from the url
    const parsedUrl = url.parse(decodeURI(req.url), true);
    var srid;
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

      // Do a POST with all the IDs from free search to get the complete objects with geometry
      await doGetFromPointAsyncCall(req, res, configOptions, x, y, token, scope, srid);
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
      var status;
      var maxHits;
      if ('status' in parsedUrl.query) {
        status = parsedUrl.query.status;
      } else {
        status = 'gällande';
      }
      if ('maxHits' in parsedUrl.query) {
        maxHits = parsedUrl.query.maxHits;
      } else {
        maxHits = '30';
      }
      
      // Do a free text search to get the IDs of all that matches
      var objectIds = await doSearchAsyncCall(municipalityArray, searchValue, configOptions, token, scope, status, maxHits);

      // Allow a maximum of 250 objects
      objectIds.length = objectIds.length > 250 ? 250 : objectIds.length;

      // Do a POST with all the IDs from free search to get the complete objects with geometry
      await getEstateAsyncCall(req, res, municipalityArray, objectIds, configOptions, token, scope, srid);
    } else {
      res.send([]);
    }
  }
}

// Do the request in proper order
const lmGetEstateFromPoint = async (req, res) => {
  let type = 'merged';

  if (conf[proxyUrl]) {
    const configOptions = Object.assign({}, conf[proxyUrl]);
    const scope = configOptions.scope;
    const parsedUrl = url.parse(decodeURI(req.url), true);
    var srid;
    if ('srid' in parsedUrl.query) {
      srid = parsedUrl.query.srid;
    } else {
       srid = '3006';
    }
    if ('type' in parsedUrl.query) {
      type = parsedUrl.query.type;
    } else {
      type = 'merged';
    }
    if ('x' in parsedUrl.query) {
      const x = parsedUrl.query.x;
      const y = parsedUrl.query.y;
      // Get a token from LM
      const tokenObject = await lmtokenhandler({
        id: proxyUrl,
        url_token: configOptions.url_token,
        url_revoke: configOptions.url_revoke,
        consumer_key: configOptions.consumer_key,
        consumer_secret: configOptions.consumer_secret,
        scope: configOptions.scope
      });
      const token = tokenObject.token;

      // Do a POST with all the IDs from free search to get the complete objects with geometry
      const estateNumbers = await doGetEstateNumberAsyncCall(configOptions, x, y, token, scope, srid);
      const fnrObjektidentitet = estateNumbers.fnrObjektidentitet;
      const fnrObjektidentitetGA = estateNumbers.fnrObjektidentitetGA;

      if (typeof fnrObjektidentitet === 'undefined') {
        // fnr is undefined do nothing
    } else {
        if (fnrObjektidentitet !== '') {
          req.url = req.url + '&fnr=' + fnrObjektidentitet;
          lmGetEstate(req, res, type);
        } else if (fnrObjektidentitetGA !== '') {
          req.url = req.url + '&fnr=' + fnrObjektidentitetGA;
          lmGetEstate(req, res, type);
        } else {
          res.send({error: 'Hittar ingen fastighet'});
        }
      }
    } else {
      res.send({});
    }
  } else {
    res.send({});
  }
}

// Export the module
module.exports = {
  lmSearchEstate,
  lmGetEstateFromPoint
};

async function doSearchAsyncCall(municipalityArray, searchValue, configOptions, token, scope, status, maxHits) {
  var returnValue = [];
  var promiseArray = [];
  var objectIds = [];
  // Split all the separate municipality given to individual searches
  municipalityArray.forEach(function(municipality) {
    var searchUrl = encodeURI(configOptions.url + 'referens/fritext?beteckning=' + municipality + ' ' + searchValue + '&status=' + status + '&maxHits=' + maxHits)
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
          if (parameter.objektidentitet) {
            beteckningsid.push(parameter.objektidentitet);
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
  return objectIds;
}

function getEstateWait(options, res, municipalityArray) {
  rp(options)
  .then(function (parsedBody) {
    // Send the resulting object as json and end response
    res.send(concatResult(parsedBody.features, municipalityArray, options.searchString));
  })
  .catch(function (err) {
    console.log(err);
    console.log('ERROR getEstateWait!');
    res.send([]);
  });
}

async function getEstateAsyncCall(req, res, municipalityArray, objectIds, configOptions, token, scope, srid) {
  if (objectIds.length > 0) {
    // Setup the call for getting the objects found in search and wait for result
    var options = {
      method: 'POST',
      uri: configOptions.url + '?srid=' + srid,
      body: objectIds,
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'scope': `${scope}`
      },
      json: true
    };
    getEstateWait(options, res, municipalityArray);
  } else {
    console.log('No objects!');
    res.send({});
  }
}

function concatResult(features, municipalityArray, searchString) {
  const result = [];

  features.forEach((feature) => {
    let objektidentitet = '';
    // Get the current assignation incase there are more than one
    const gallandBeteckning = feature.properties.registerbeteckning.find(beteckning => beteckning.beteckningsstatus === "gällande");
    const registeromrade = gallandBeteckning.registeromrade ? gallandBeteckning.registeromrade : '';
    const beteckningsid = gallandBeteckning.objektidentitet;
    const beteckning = gallandBeteckning.trakt ? gallandBeteckning.trakt : '';
    const block = gallandBeteckning.block ? gallandBeteckning.block : '';
    const enhet = gallandBeteckning.enhet ? gallandBeteckning.enhet : '';
    let coordinates = [];
    // Check to see if feature has none or multiple coordinates
    if ('registerenhetsreferens' in feature.properties) {
      objektidentitet = feature.properties.registerenhetsreferens.objektidentitet;
      if ('registerenhetsomrade' in feature.properties.registerenhetsreferens) {
        feature.properties.registerenhetsreferens.registerenhetsomrade.forEach((enhetsomrade) => {
          if ('centralpunktskoordinat' in enhetsomrade) {
            coordinates.push(enhetsomrade.centralpunktskoordinat.coordinates);
          }
        })
      }
    }
    if ('gemensamhetsanlaggningsreferens' in feature.properties) {
      objektidentitet = feature.properties.gemensamhetsanlaggningsreferens.objektidentitet;
      if ('registerenhetsomrade' in feature.properties.gemensamhetsanlaggningsreferens) {
        feature.properties.gemensamhetsanlaggningsreferens.registerenhetsomrade.forEach((enhetsomrade) => {
          if ('centralpunktskoordinat' in enhetsomrade) {
            coordinates.push(enhetsomrade.centralpunktskoordinat.coordinates);
          }
        })
      }
    }

    // Build the object to return
    let object = {};
    let fastighet = '';
    switch (block) {
      case '*':
        fastighet = registeromrade + ' ' + beteckning + ' ' + enhet;
        break;
      case '':
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
      // Only show those municipalities that has been searched in
      var municipalityArrayLower = municipalityArray.map(v => v.toLowerCase());
      if (municipalityArrayLower.includes(registeromrade.toLowerCase())) {
        result.push(object);
      }
    }
  })

  result.sort((a, b) => compareRelevance(a.properties.name, b.properties.name, searchString) || compareNamesNaturally(a.properties.name, b.properties.name));

  return result;
}

function doGetFromPointWait(req, res, options) {
  rp(options)
  .then(function (parsedBody) {
    console.log('doGetFromPointWait result: ' + JSON.stringify(parsedBody));
    res.send(concatEstateNameResult(parsedBody));
  })
  .catch(function (err) {
    console.log(err);
    console.log('ERROR doGetFromPointWait!');
    res.send({});
  });
}

async function doGetFromPointAsyncCall(req, res, configOptions, easting, northing, token, scope, srid) {
  // Setup the search call and wait for result
  const options = {
      url: encodeURI(configOptions.url + 'punkt?punktSrid=' + srid + '&koordinater=' + northing + ',' + easting + '&srid=' + srid),
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
      const registeromrade = element.properties.registerbeteckning[0].registeromrade ? element.properties.registerbeteckning[0].registeromrade : '';
      const beteckning = element.properties.registerbeteckning[0].trakt ? element.properties.registerbeteckning[0].trakt : '';
      const block = element.properties.registerbeteckning[0].block ? element.properties.registerbeteckning[0].block : '';
      const enhet = element.properties.registerbeteckning[0].enhet ? element.properties.registerbeteckning[0].enhet : '';
      //const objektidentitet = element.properties.registerenhetsreferens.objektidentitet;

      switch (block) {
        case '*':
          fastighet = registeromrade + ' ' + beteckning + ' ' + enhet;
          break;
        case '':
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

async function doGetEstateNumberAsyncCall(configOptions, easting, northing, token, scope, srid) {
  var promiseArray = [];
  var fnrObjektidentitet = '';
  var fnrObjektidentitetGA = '';

  // Setup the search call and wait for result
  const options = {
      url: encodeURI(configOptions.url + 'punkt?punktSrid=' + srid + '&koordinater=' + northing + ',' + easting + '&srid=' + srid),
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
      const numbers = concatEstateNumberResult(parsedBody);
      fnrObjektidentitet = numbers.fnrObjektidentitet;
      fnrObjektidentitetGA = numbers.fnrObjektidentitetGA;
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
        fnrObjektidentitetGA = '';
    })
    .finally(function () {
        // The result has been handled in concatEstateNumberResult()
    });

  return {
    fnrObjektidentitet,
    fnrObjektidentitetGA
  };
}

function concatEstateNumberResult(feature) {
  let fnrObjektidentitet = '';
  let fnrObjektidentitetGA = '';

  if ('features' in feature) {
    feature.features.forEach((element) => {
      if ('registerenhetsreferens' in element.properties) {
        fnrObjektidentitet = element.properties.registerenhetsreferens.objektidentitet;
      } else if ('gemensamhetsanlaggningsreferens' in element.properties) {
        fnrObjektidentitetGA = element.properties.gemensamhetsanlaggningsreferens.objektidentitet;
      }
    })
  }

  return {
    fnrObjektidentitet,
    fnrObjektidentitetGA
  };
}
