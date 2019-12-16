var conf = require('../conf/config');
var request = require('request');
var soap = require('soap');
const url = require('url');
var transformCoordinates = require('../lib/utils/transformCoordinates');
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

    const parsedUrl = url.parse(decodeURI(req.url), true);
    var kommunkod = parsedUrl.query.kommunkod;
    // Get a object with municipality from the 4-digit code
    var municipality = getMunicipality(kommunkod);
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
    var searchParams = {};
    if ( q.length > 0 ) {
      searchParams['tns:namn'] = {
        attributes: {
          match: 'STARTS_WITH'
        },
        $value: q
      };
    }
    // Limit the hits to county and municipality
    if ( kommunkod ) {
      searchParams['tns:lanskod'] = municipality.countyCode;
      searchParams['tns:kommunkod'] = municipality.municipalityCode;
    }
    // Set language for result
    if ( lang ) {
      searchParams['tns:sprak'] = lang;
    }
    // Limit the hits to nametypes
    if ( nametype ) {
      var tempData = [];
      const nametypes = nametype.split(/[=;]/);
      nametypes.forEach(typ => {
        tempData.push( { 'tns:namntyp': typ } );
      });
      searchParams['tns:namntyper'] = tempData;
    }
    // Get the result based on pages
    if ( page && limit ) {
      searchParams['tns:intervall'] = {
        attributes: {
          slutindex: limit * page,
          startindex: limit * page - limit
        }
      };
    } else {
      // Get only the first result
      if ( start && limit ) {
        searchParams['tns:intervall'] = {
          attributes: {
            slutindex: limit,
            startindex: start
          }
        };
      }
    }
    var args = { 'tns:OrtnamnCriteria': searchParams };
    soap.createClient(configOptions.url, function(err, client) {
      client.setSecurity(new soap.BasicAuthSecurity(configOptions.auth.user, configOptions.auth.pass));
      client.addHttpHeader('Content-Type', `application/soap+xml`);
      client.FindOrtnamn(args, function(err, result) {
        if (err) {
          console.log('Error:' + err.root.Envelope.Body.Fault.Reason.Text.$value);
          res.send({ error: err.root.Envelope.Body.Fault.Reason.Text.$value });
        } else {
          res.send(concatResult(result.Ortnamn, municipality));
        }
      }, {postProcess: function(_xml) {
        // Replace namespace URI, since the API chokes on it
        return _xml.replace('http://schemas.xmlsoap.org/soap/envelope/', 'http://www.w3.org/2003/05/soap-envelope');
      }});
    });
  }
}

// Export the module
module.exports = lmSearchPlacename;

function concatResult(placenames, municipality) {
  const result = [];

  // Check to see if there are multiple hits or a single
  if (Array.isArray(placenames)) {
    placenames.forEach((placename) => {
      result.push(getOrtnamn(placename, municipality));
    })
  } else {
    result.push(getOrtnamn(placenames, municipality));
  }
  return result;
}

function getOrtnamn(placename, municipality) {
  const id = placename.id;
  const namn = placename.namn;
  let lanskod = '';
  let kommunkod = '';
  let coordinates = [];
  // Check to see if feature has none or multiple coordinates
  if ('punkt' in placename.placering) {
    lanskod = placename.placering.lanskod;
    kommunkod = placename.placering.kommunkod;
    const pos = placename.placering.punkt.pos.split(/[= ]/);
    coordinates = transformCoordinates('3006', srid, [Number(pos[1]),Number(pos[0])]);
  } else {
    placename.placering.forEach((placering) => {
      const pos = placering.punkt.pos.split(/[= ]/);
      coordinates.push(transformCoordinates('3006', srid, [Number(pos[1]),Number(pos[0])]));
      lanskod = placering.lanskod;
      kommunkod = placering.kommunkod;
    })
  }
  // If the kommunkod wasn't supplied in request get the municipality from the response
  if (municipality.countyCode === '00') {
    municipality = getMunicipality(lanskod.padStart(2, '0')+kommunkod.padStart(2, '0'));
  }

  // Build the object to return
  let object = {};
  if (coordinates[0].length !== 2) {
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
  object['properties'] = {
      id: id,
      name: namn,
      municipality: municipality.municipalityName
  };
  object['type'] = 'Feature';

  return object;
}
