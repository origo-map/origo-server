var conf = require('../conf/config');
var rp = require('request-promise');
const url = require('url');
const { compareRelevance, compareNamesNaturally } = require('../utils/compare');
const lmtokenhandler = require('./lmtokenhandler');

var proxyUrl = 'lmsearchaddress';

// Do the request in proper order
const lmSearchAddress = async (req, res) => {

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
    const searchString = parsedUrl.query.q || '';
    const northing = parsedUrl.query.northing || undefined;
    const easting = parsedUrl.query.easting || undefined;
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
    var srid;
    var maxHits;
    var format;
    var statusAddress;
    var municipalityCodes;
    if ('srid' in parsedUrl.query) {
      srid = parsedUrl.query.srid;
    } else {
       srid = '3006';
    }
    if ('maxHits' in parsedUrl.query) {
      maxHits = parsedUrl.query.maxHits;
    } else {
      maxHits = '30';
    }
    if ('format' in parsedUrl.query) {
      format = parsedUrl.query.format;
    } else {
      format = '';
    }
    if ('statusAddress' in parsedUrl.query) {
      statusAddress = parsedUrl.query.statusAddress;
    } else {
      statusAddress = 'Gällande';
    }
    if ('municipalityCodes' in parsedUrl.query) {
      municipalityCodes = parsedUrl.query.municipalityCodes.split(',');
    } else {
      municipalityCodes = [];
    }
    if (northing !== undefined && easting !== undefined) {
      getAddressPointAsyncCall(northing, easting, req, res, configOptions, token, scope, srid, format);
    } else {
      var objectIds;
      if (municipalityCodes.length > 0) {
        // Do a free text search with municipality codes to get the IDs of all that matches
        objectIds = await doSearchWithCodesAsyncCall(municipalityCodes, searchString, configOptions, token, scope, statusAddress, maxHits);
      } else {
        // Do a free text search to get the IDs of all that matches
        objectIds = await doSearchAsyncCall(municipalityArray, searchValue, configOptions, token, scope, statusAddress, maxHits);
      }

      // Allow a maximum of 250 objects
      objectIds.length = objectIds.length > 250 ? 250 : objectIds.length;

      // Do a POST with all the IDs from free search to get the complete objects with geometry
      await getAddressAsyncCall(req, res, objectIds, configOptions, token, scope, srid);
    }
  }
}

// Export the module
module.exports = lmSearchAddress;

async function doSearchWithCodesAsyncCall(municipalityCodes, searchValue, configOptions, token, scope, statusAddress, maxHits) {
  var returnValue = [];
  var promiseArray = [];
  var objectIds = [];
  // Split all the separate municipality given to individual searches
  municipalityCodes.forEach(function(municipality) {
    var searchUrl = encodeURI(configOptions.url + '/referens/fritext?adress=' + searchValue.replaceAll(',','') + ' &kommunkod=' + municipality + '&status=' + statusAddress + '&maxHits=' + maxHits)
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
        var objektidentitet = [];

        parameters.forEach(function(parameter) {
          if (parameter.objektidentitet) {
            objektidentitet.push(parameter.objektidentitet);
          }
        });
        return objektidentitet;
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

async function doSearchAsyncCall(municipalityArray, searchValue, configOptions, token, scope, statusAddress, maxHits) {
  var returnValue = [];
  var promiseArray = [];
  var objectIds = [];
  // Split all the separate municipality given to individual searches
  municipalityArray.forEach(function(municipality) {
    var searchUrl = encodeURI(configOptions.url + '/referens/fritext?adress=' + searchValue.replaceAll(',','') + ' ' + municipality + '&status=' + statusAddress + '&maxHits=' + maxHits)
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
        var objektidentitet = [];

        parameters.forEach(function(parameter) {
          if (parameter.objektidentitet) {
            objektidentitet.push(parameter.objektidentitet);
          }
        });
        return objektidentitet;
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

function getAddressWait(options, res) {
  rp(options)
  .then(function (parsedBody) {
    // Send the resulting object as json and end response
    res.send(concatResult(parsedBody.features, options.searchString));
  })
  .catch(function (err) {
    console.log(err);
    console.log('ERROR getAddressWait!');
    res.send([]);
  });
}

function getAddressPointWait(options, res, configOptions, token, scope, srid, format) {
  rp(options)
  .then(function (result) {
    var parameters = JSON.parse(result);
    if (parameters.features[0].id !== undefined) {
      const options = {
          url: encodeURI(configOptions.url + '/' + parameters.features[0].id + '?includeData=total&srid=' + srid),
          method: 'GET',
          headers: {
            'content-type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'scope': `${scope}`
          }
      };
      rp(options)
      .then(function (adress) {
        var registerenhet = JSON.parse(adress);
        if (format === 'Origo') {
          res.send(concatAddress(registerenhet.features[0]));
        } else {
          res.send(registerenhet);
        }
      })
      .catch(function (err) {
        console.log(err);
        console.log('ERROR getAddressPointWait!');
        res.send({});
      });
    }
    return parameters;
  })
  .catch(function (err) {
    console.log(err);
    console.log('ERROR getAddressPointWait!');
    res.send({});
  });
}

async function getAddressAsyncCall(req, res, objectIds, configOptions, token, scope, srid) {
  // Setup the call for getting the objects found in search and wait for result
  var options = {
    method: 'POST',
    uri: configOptions.url + '/?includeData=total&srid=' + srid,
    body: objectIds,
    headers: {
      'content-type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'scope': `${scope}`
    },
    json: true
  };
  // Only do the call if somethin was found in the search
  if (objectIds.length > 0) {
    await getAddressWait(options, res);
  } else {
    res.send([]);
  }
}

async function getAddressPointAsyncCall(northing, easting, req, res, configOptions, token, scope, srid, format) {
  // Setup the call for getting the objects found in search and wait for result
  var options = {
    method: 'GET',
    uri: configOptions.url + '/punkt?punktSrid=' + srid + '&koordinater=' + northing + ',' + easting + '&includeData=total&srid=' + srid,
    headers: {
      'content-type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'scope': `${scope}`
    }
  };
  await getAddressPointWait(options, res, configOptions, token, scope, srid, format);
}

function concatResult(features, searchString) {
  const result = [];

  features.forEach((feature) => {
    const objektidentitet_1 = feature.properties.objektidentitet;
    const objektidentitet_2 = feature.properties.registerenhetsreferens.objektidentitet;
    const kommun = feature.properties.adressomrade ? feature.properties.adressomrade.kommundel.faststalltNamn : feature.properties.gardsadressomrade.adressomrade.kommundel.faststalltNamn;
    let faststalltNamn = '';
    if ('gardsadressomrade' in feature.properties) {
      faststalltNamn = feature.properties.gardsadressomrade.adressomrade.faststalltNamn + ' ' + feature.properties.gardsadressomrade.faststalltNamn;
    }
    else {
      faststalltNamn = feature.properties.adressomrade.faststalltNamn;
    }
    let popularnamn = '';
    if ('adressplatsnamn' in feature.properties) {
      if ('popularnamn' in feature.properties.adressplatsnamn) {
        popularnamn = feature.properties.adressplatsnamn.popularnamn;
      }
    }
    const adressplatsnummer = feature.properties.adressplatsattribut.adressplatsbeteckning.adressplatsnummer || '';
    const bokstavstillagg = feature.properties.adressplatsattribut.adressplatsbeteckning.bokstavstillagg || '';
    const postnummer = feature.properties.adressplatsattribut.postnummer;
    const postort = feature.properties.adressplatsattribut.postort;
    const koordinater = feature.geometry.coordinates;

    if (popularnamn !== '') {
      result.push([objektidentitet_1, faststalltNamn + ' ' + adressplatsnummer + bokstavstillagg + ', ' + postort + ' (' + popularnamn + ')', koordinater[0], koordinater[1], objektidentitet_2]);
    } else {
      result.push([objektidentitet_1, faststalltNamn + ' ' + adressplatsnummer + bokstavstillagg + ', ' + postort, koordinater[0], koordinater[1], objektidentitet_2]);      
    }
  })
  result.sort((a, b) => compareRelevance(a[1], b[1], searchString) || compareNamesNaturally(a[1], b[1]));

  return result;
}

function concatAddress(feature) {
  let adress = {};

  if ('id' in feature) {
    adress['objektidentitet'] = feature.properties.objektidentitet;
    adress['kommun'] = feature.properties.adressomrade.kommundel.kommun;
    const faststalltNamn = feature.properties.adressomrade.faststalltNamn;
    const adressplatsnummer = feature.properties.adressplatsattribut.adressplatsbeteckning.adressplatsnummer || '';
    const bokstavstillagg = feature.properties.adressplatsattribut.adressplatsbeteckning.bokstavstillagg || '';
    let popularnamn = '';
    if ('adressplatsnamn' in feature.properties) {
      if ('popularnamn' in feature.properties.adressplatsnamn) {
        popularnamn = feature.properties.adressplatsnamn.popularnamn;
      }
    }
    adress['adress'] = faststalltNamn + ' ' + adressplatsnummer + bokstavstillagg + ', ' + feature.properties.adressplatsattribut.postort;
    adress['popularnamn'] = popularnamn;
    adress['faststalltNamn'] = faststalltNamn;
    adress['adressplatsnummer'] = adressplatsnummer;
    adress['bokstavstillagg'] = bokstavstillagg;
    adress['postnummer'] = feature.properties.adressplatsattribut.postnummer;
    adress['postort'] = feature.properties.adressplatsattribut.postort;
    adress['adressplatspunkt'] = feature.properties.adressplatsattribut.adressplatspunkt;
  }
  return adress;
}
