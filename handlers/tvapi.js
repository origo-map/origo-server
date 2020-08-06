var conf = require('../conf/config');
var request = require('request');
var rp = require('request-promise');
var transformCoordinates = require('../lib/utils/transformcoordinates');
const url = require('url');
const wkt = require('wkt');
const { parse } = require('wkt');

var objectIds;
var username;
var password;
var output;
var srid;
var validProjs = ["3006", "3007", "3008", "3009", "3010", "3011", "3012", "3013", "3014", "3015", "3016", "3017", "3018", "3857", "4326"];

// Token holder
let token;
let scope;
var proxyUrl = 'tvapi';

// Do the request in proper order
const tvApi = async (req, res) => {

  if (conf[proxyUrl]) {
    configOptions = Object.assign({}, conf[proxyUrl]);
    scope = configOptions.scope;
    const parsedUrl = url.parse(decodeURI(req.url), true);
    if ('srid' in parsedUrl.query) {
      srid = parsedUrl.query.srid;
    } else {
      srid = '3006';
    }
    if ('output' in parsedUrl.query) {
      output = parsedUrl.query.output;
    } else {
      output = '';
    }
    if ('q' in parsedUrl.query) {
      q = parsedUrl.query.q;
    } else {
      q = '';
      console.log('No query specified!');
      res.send({});
    }

    if (conf[proxyUrl]) {
      options = Object.assign({}, conf[proxyUrl]);
      options.services.forEach((service) => {
        if (q === service.name) {
          doGet(req, res, service, srid, output);
        }
      });
    } else {
      console.log('ERROR config!');
      res.send({});
    }
  }
}

// Export the module
module.exports = tvApi;

function doGet(req, res, configOptions, srid, output) {
  // Setup the search call and wait for result
  const options = {
    url: encodeURI(configOptions.url),
    method: 'POST',
    headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'text/xml',
        'Content-Length': Buffer.byteLength(configOptions.query)
    },
    body: configOptions.query,
    json: false  // Automatically parses the JSON string in the response
  }

  rp(options)
  .then(function (result) {
    var resultObj = JSON.parse(result);
    if (output === 'geojson') {
      resultObj.RESPONSE.RESULT.forEach((type) => {
        if (configOptions.type in type) {
          res.send(createGeojson(type[configOptions.type], configOptions, srid));
        }
      });
    } else {
      res.send(resultObj);
    }
  })
  .catch(function (err) {
    console.log(err);
    console.log('ERROR doGet!');
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
    entity.Deviation.forEach((deviation) => {
      const tempEntity = {};
      let hasGeometry = false;
      tempEntity['type'] = 'Feature';
      if ("Geometry" in deviation) {
        tempEntity['geometry'] = parse(deviation.Geometry.Point.SWEREF99TM);
        hasGeometry = true;
      } else {
        hasGeometry = false;
      }
      tempEntity['properties'] = {
        AffectedDirection: deviation.AffectedDirection,
        AffectedDirectionValue: deviation.AffectedDirectionValue,
        Creator: deviation.Creator,
        CreationTime: deviation.CreationTime,
        EndTime: deviation.EndTime,
        IconId: deviation.IconId,
        Id: deviation.Id,
        ManagedCause: deviation.ManagedCause,
        Message: deviation.Message,
        MessageCode: deviation.MessageCode,
        MessageCodeValue: deviation.MessageCodeValue,
        MessageType: deviation.MessageType,
        MessageTypeValue: deviation.MessageTypeValue,
        NumberOfLanesRestricted: deviation.NumberOfLanesRestricted,
        RoadNumber: deviation.RoadNumber,
        RoadNumberNumeric: deviation.RoadNumberNumeric,
        SeverityCode: deviation.SeverityCode,
        SeverityText: deviation.SeverityText,
        StartTime: deviation.StartTime,
        LocationDescriptor: deviation.LocationDescriptor,
        TrafficRestrictionType: deviation.TrafficRestrictionType,
        VersionTime: deviation.VersionTime
      };
      if (hasGeometry) {
        features.push(tempEntity);
      }
    });
  });
  result['features'] = features;
  return result;
}
