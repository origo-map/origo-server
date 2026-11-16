var conf = require('../conf/config');
var rp = require('request-promise');
var transformCoordinates = require('../lib/utils/transformcoordinates');
const url = require('url');
const lmtokenhandler = require('./lmtokenhandler');
//var Promise = require('bluebird');

var validProjs = ["3006", "3007", "3008", "3009", "3010", "3011", "3012", "3013", "3014", "3015", "3016", "3017", "3018", "3857", "4326"];

var proxyUrl = 'lmgetestate';

// Do the request in proper order
const lmGetEstate = async (req, res, type = 'merged') => {

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
    if ('fnr' in parsedUrl.query) {
      const fnr = parsedUrl.query.fnr;
      // RegExp for UUID
      const uuidRegEx = /[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/i;
      let found = fnr.match(uuidRegEx);
      // Check to see if the fnr are a valid UUID and only proceed if it is
      if (found !== null) {
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
        await doGetAsyncCall(req, res, configOptions, fnr, type, token, scope, srid);
      } else {
        res.send({});
      }
    } else {
      res.send({});
    }
  }
}

// Export the module
module.exports = lmGetEstate;

function doGetWait(req, res, options, type, srid) {
  rp(options)
  .then(function (parsedBody) {
    if (type === 'full') {
      res.send(parsedBody);
    } else {
      res.send(concatResult(parsedBody, srid));
    }
  })
  .catch(function (err) {
    console.log(err);
    console.log('ERROR doGetWait!');
    res.send({});
  });
}

async function doGetAsyncCall(req, res, configOptions, fnr, type, token, scope, srid) {
  // Setup the search call and wait for result
  const options = {
      url: encodeURI(configOptions.url + '/' + fnr + '?includeData=total' + '&srid=' + srid),
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'scope': `${scope}`
      },
      json: true // Automatically parses the JSON string in the response
  }

  await doGetWait(req, res, options, type, srid);
}

function concatResult(feature) {
  const result = {};
  let geometryEnhetsomrade = [];

  if ('features' in feature) {
    feature.features.forEach((element) => {
      // Get the current assignation incase there are more than one
      const gallandBeteckning = element.properties.registerbeteckning.find(beteckning => beteckning.beteckningsstatus === "gällande");
      const registeromrade = gallandBeteckning.registeromrade ? gallandBeteckning.registeromrade : '';
      const beteckning = gallandBeteckning.trakt ? gallandBeteckning.trakt : '';
      const block = gallandBeteckning.block ? gallandBeteckning.block : '';
      const enhet = gallandBeteckning.enhet ? gallandBeteckning.enhet : '';
      const objektidentitet = element.properties.objektidentitet;
      const typ = element.properties.typ;
      let samfallighetsattribut = {};
      let delagare = [];
      if ('samfallighetsattribut' in element.properties) {
        samfallighetsattribut = element.properties.samfallighetsattribut;
      }
      if ('delagare' in element.properties) {
        delagare = element.properties.delagare;
      }
      let fastighetsattribut = {};
      if ('fastighetsattribut' in element.properties) {
        fastighetsattribut = element.properties.fastighetsattribut;
      }
      if ('registerenhetsomrade' in element.properties) {
        element.properties.registerenhetsomrade.forEach((enhetsomrade) => {
          const oneFeature = {};
          const omradesnummer = enhetsomrade.omradesnummer;
          let coordinates = [];
          let coordinatesType = '';
          // Only add to response if there is a geometry for enhetsomrade
          if ('yta' in enhetsomrade) {
            coordinatesType = enhetsomrade.yta[0].type;
            coordinates = enhetsomrade.yta[0].coordinates;
            oneFeature['geometry'] = {
              coordinates: coordinates,
              type: coordinatesType
            };
            let fastighet = '';
            switch (block) {
              case '*':
                fastighet = registeromrade + ' ' + beteckning + ' ' + enhet + ' Enhetsområde ' + omradesnummer;
                break;
              case '':
                fastighet = registeromrade + ' ' + beteckning + ' ' + enhet + ' Enhetsområde ' + omradesnummer;
                break;
              default:
                fastighet = registeromrade + ' ' + beteckning + ' ' + block + ':' + enhet + ' Enhetsområde ' + omradesnummer;
            }
            oneFeature['properties'] = {
              name: fastighet,
              objektidentitet: objektidentitet,
               typ,
              fastighetsattribut,
              samfallighetsattribut,
              delagare
            };
            oneFeature['type'] = 'Feature';
            geometryEnhetsomrade.push(oneFeature);
          } else {
            const centerPoint = {};
            const registerenhetsomradeGeometry = [];
            // Don't add this area, since it's waiting to get coordinates
            if (!('koordinatbevakningAKRA' in enhetsomrade)) {                
              centerPoint['properties'] = {
                name: registeromrade + ' ' + beteckning + ' ' + enhet,
                objektidentitet: objektidentitet,
                typ,
                fastighetsattribut,
                samfallighetsattribut
              };
              centerPoint['type'] = 'Feature';
              element.properties.registerenhetsomrade.forEach((omrade) => {
                if (typeof omrade.yta !== 'undefined') {
                    const registerenhetsomradeYta = {};
                    if (Array.isArray(omrade.yta)) {
                      registerenhetsomradeYta['geometry'] = omrade.yta[0];
                    } else {
                      registerenhetsomradeYta['geometry'] = omrade.yta;
                    }
                    registerenhetsomradeYta['properties'] = {
                      name: registeromrade + ' ' + beteckning + ' ' + enhet,
                      objektidentitet: objektidentitet,
                      typ,
                      fastighetsattribut,
                      samfallighetsattribut,
                      delagare
                    };
                    registerenhetsomradeYta['type'] = 'Feature';
                    registerenhetsomradeGeometry.push(registerenhetsomradeYta);
                } else if (typeof omrade.centralpunktskoordinat !== 'undefined') {
                  const registerenhetsomradePunkt = {};
                  registerenhetsomradePunkt['geometry'] = omrade.centralpunktskoordinat;
                  registerenhetsomradePunkt['properties'] = {
                    name: registeromrade + ' ' + beteckning + ' ' + enhet,
                    objektidentitet: objektidentitet,
                    typ,
                    fastighetsattribut,
                    samfallighetsattribut,
                    delagare
                  };
                  registerenhetsomradePunkt['type'] = 'Feature';
                  registerenhetsomradeGeometry.push(registerenhetsomradePunkt);
                }

              })
            }
            if (registerenhetsomradeGeometry.length == 1) {
              geometryEnhetsomrade.push(registerenhetsomradeGeometry[0]);
            } else {
              result['features'] = registerenhetsomradeGeometry;
            }
           }
        })
      }
    })
  }

  result['features'] = geometryEnhetsomrade;
  result['type'] = 'FeatureCollection';

  return result;
}
