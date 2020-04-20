var conf = require('../conf/config');
var request = require('request');
var rp = require('request-promise');
var transformCoordinates = require('../lib/utils/transformcoordinates');
const url = require('url');

module.exports = function iotProxy(req, res) {
  var proxyUrl = 'iotproxy';
  var options;
  var srid;
  var q;
  // Get the query parameters from the url
  const parsedUrl = url.parse(decodeURI(req.url), true);
  if ('srid' in parsedUrl.query) {
    srid = parsedUrl.query.srid;
  } else {
     srid = '3006';
  }
  if ('q' in parsedUrl.query) {
    q = parsedUrl.query.q;
  } else {
    q = '';
    console.log('No service specified!');
    res.send({});
  }

  if (conf[proxyUrl]) {
    options = Object.assign({}, conf[proxyUrl]);
    options.services.forEach((service) => {
      if (q === service.name) {
        doGet(req, res, service, srid);
      }
    });
  } else {
    console.log('ERROR config!');
    res.send({});
  }
}

function doGet(req, res, configOptions, srid) {
  // Setup the search call and wait for result
  const options = {
      url: configOptions.url,
      method: 'GET',
      json: true // Automatically parses the JSON string in the response
  }

  rp(options)
  .then(function (parsedBody) {
    res.send(createGeojson(parsedBody, configOptions, srid));
  })
  .catch(function (err) {
    console.log(err);
    console.log('ERROR doGetFromPointWait!');
    res.send({});
  });
}


function createGeojson(entities, configOptions, srid) {
  const result = {};
  let features = [];
  result['type'] = 'FeatureCollection';
  result['name'] = configOptions.title;
  result['crs'] = {
    type: 'name',
    properties: { name: 'urn:ogc:def:crs:EPSG::' + srid }
  };

  entities.forEach((entity) => {
    const tempEntity = {};
    tempEntity['type'] = 'Feature';
    tempEntity['geometry'] = {
      coordinates: transformCoordinates('4326', srid, entity.location.value.coordinates),
      type: entity.location.value.type
    };
    tempEntity['properties'] = {
      id: entity.refDevice.object,
      type: entity.type
    };
    configOptions.properties.forEach((property) => {
      if (property === 'temperature') {
        tempEntity['properties']['temperature'] = entity.temperature.value;
      }
      if (property === 'snowHeight') {
        tempEntity['properties']['snowHeight'] = entity.snowHeight.value;
      }
      if (property === 'dateObserved') {
        tempEntity['properties']['dateObserved'] =  entity.dateObserved.value['@value'];
      }
    });
    features.push(tempEntity);
  });
  result['features'] = features;
  return result;
}
