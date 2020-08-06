var conf = require('../conf/config');
var request = require('request');
var rp = require('request-promise');
var transformCoordinates = require('../lib/utils/transformcoordinates');
const url = require('url');
const wkt = require('wkt');
const { parse } = require('wkt');
var iconv = require('iconv-lite');

var objectIds;
var username;
var password;
var output;
var srid;
var validProjs = ["3006", "3007", "3008", "3009", "3010", "3011", "3012", "3013", "3014", "3015", "3016", "3017", "3018", "3857", "4326"];
var filterOn = '';
var filterValue = '';

// Token holder
let token;
let scope;
var proxyUrl = 'convertToGeojson';

// Do the request in proper order
const convertToGeojson = async (req, res) => {

  if (conf[proxyUrl]) {
    configOptions = Object.assign({}, conf[proxyUrl]);
    scope = configOptions.scope;
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
      console.log('No converting specified!');
      res.send({});
    }

    if (conf[proxyUrl]) {
      options = Object.assign({}, conf[proxyUrl]);
      options.converts.forEach((convert) => {
        if (typeof convert.filterOn !== 'undefined' || convert.filterOn !== null) {
          filterOn = convert.filterOn;
          filterValue = parsedUrl.query[filterOn];
        }
      if (q === convert.name) {
          doGet(req, res, convert, srid, filterOn, filterValue);
        }
      });
    } else {
      console.log('ERROR config!');
      res.send({});
    }
  }
}

// Export the module
module.exports = convertToGeojson;

function doGet(req, res, configOptions, srid, filterOn, filterValue) {
  // Setup the search call and wait for result
  const options = {
    url: encodeURI(configOptions.url),
    method: 'GET',
    encoding: null,
    json: false  // Automatically parses the JSON string in the response set to true
  }

  rp(options)
  .then(function (result) {
    var body = {};
    if (typeof configOptions.encoding === 'undefined' || configOptions.encoding === null) {
      body = JSON.parse(result);
    } else {
      var bodyWithCorrectEncoding = iconv.decode(result, configOptions.encoding);
      body = JSON.parse(bodyWithCorrectEncoding);
    }
    res.send(createGeojson(body[configOptions.arrayOfObjects], configOptions, srid, filterOn, filterValue));
  })
  .catch(function (err) {
    console.log(err);
    console.log('ERROR doGet!');
    res.send({});
  });
}

function createGeojson(entities, configOptions, srid, filterOn, filterValue) {
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
    const tempProperties = {};
    let hasGeometry = false;
    tempEntity['type'] = 'Feature';
    if ("Array" === configOptions.geometry_format) {
      if (typeof entity[configOptions.geometry] !== 'undefined' && entity[configOptions.geometry] !== null) {
        tempEntity['geometry'] = {
          coordinates: JSON.parse(entity[configOptions.geometry]),
          type: configOptions.geometry_type
        };
        hasGeometry = true;
      } else {
        hasGeometry = false;
      }
    } else if ("GeometryCollections" === configOptions.geometry_format) {
      var i;
      var tempGeometries = [];
      for (i = 0; i < configOptions.geometry.length; i++) {
        if (typeof entity[configOptions.geometry[i]] !== 'undefined' && entity[configOptions.geometry[i]] !== null) {
          tempGeometries.push({
              type: configOptions.geometry_type[i],
              coordinates: JSON.parse(entity[configOptions.geometry[i]])
          });
        }
      }
      tempEntity['geometry'] = {
         type: 'GeometryCollection',
         geometries: tempGeometries
      }
      hasGeometry = true;
    }
    configOptions.properties.forEach((property) => {
      tempProperties[property] = entity[property];
    });
    tempEntity['properties'] = tempProperties;
    // Only add those with a geometry
    if (hasGeometry) {
      // If no filter parameter was configed then all should be pushed
      if (filterOn === '') {
        features.push(tempEntity);
      } else {
        // If no value for the filter is supplied then all should be pushed
        if (typeof filterValue === 'undefined' || filterValue === null || filterValue === '') {
          features.push(tempEntity);
        } else {
          if (filterValue == entity[filterOn] ){
            features.push(tempEntity);
          }
        }
      }
    }
  });
  result['features'] = features;
  return result;
}
