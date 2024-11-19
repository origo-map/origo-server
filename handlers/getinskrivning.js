var conf = require('../conf/config');
var objectifier = require('../lib/utils/objectifier');
var request = require('request');
var rp = require('request-promise');
var inskrivning = require('../models/inskrivning');
var parser = require('./inskrivning/parser');
var referensParser = require('./inskrivning/referensparser');
var lagfartParser = require('./inskrivning/lagfartparser');
var tomtrattParser = require('./inskrivning/tomtrattparser');
var tidigareParser = require('./inskrivning/tidigareparser');
var getToken = require('../lib/tokenrequest');
const url = require('url');
var token;
var handler = 'getInskrivning';
var linkToBuilding = true;

var getInskrivning = async (req, res) => {
  if (conf[handler]) {
    configOptions = Object.assign({}, conf[handler]);
    const parsedUrl = url.parse(decodeURI(req.url), true);
    if (typeof conf[handler].linktobuilding !== 'undefined') {
      linkToBuilding = conf[handler].linktobuilding
    }

    if ('objektid' in parsedUrl.query) {
      const objektid = parsedUrl.query.objektid;
      // RegExp for UUID
      const uuidRegEx = /[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/i;
      let found = objektid.match(uuidRegEx);
      // Check to see if the fnr are a valid UUID and only proceed if it is
      if (found !== null) {
        // Get a token from LM
        await getTokenAsyncCall(configOptions.url_token, configOptions.consumer_key, configOptions.consumer_secret, configOptions.scope);

        // Do a POST with all the IDs from free search to get the complete objects with geometry
        await doGetAsyncCall(req, res, configOptions, objektid);
      } else {
        res.render('inskrivningerror', {
          fid: objektid
        });
      }
    } else {
      res.render('inskrivningerror', {
        fid: 'No objektid!'
      });
    }
  } else {
    res.render('inskrivningerror', {
      error: 'No config!'
    });
  }
}

module.exports = getInskrivning;

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

async function getTokenAsyncCall(url_token, consumer_key, consumer_secret, scope) {
  // Request a token from Lantmateriet API
  const options = {
      url: url_token,
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

function doGetWait(req, res, options, objektid) {
  rp(options)
  .then(function (parsedBody) {
    var inskrivning = parseResult(parsedBody);
    res.render('inskrivning', inskrivning);
  })
  .catch(function (err) {
    console.log(err);
    console.log('ERROR doGetWait!');
    res.render('inskrivningerror', {
      fid: objektid
    });
  });
}

async function doGetAsyncCall(req, res, config, objektid) {
  // Setup the search call and wait for result
  const options = {
      url: encodeURI(config.url + '/beror/' + objektid + '?includeData=agareAlla'),
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'content-type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      json: true // Automatically parses the JSON string in the response
  }

  await doGetWait(req, res, options, objektid);
}

function parseResult(result) {
  var inskriv = {};
  if ('properties' in result.features[0]) {
    var data = objectifier.find('properties', result);
    var dataRegisterenhet = objectifier.find('fastighetsreferens', result);
    var model = inskrivning();
    var tomtratter;
    //Registerenhet
    inskriv.referens = parser(model.referens, dataRegisterenhet, referensParser);
    if (linkToBuilding) {
      inskriv.objektidentitet = dataRegisterenhet.objektidentitet;
    }

    //Ägare
    inskriv.lagfart = lagfartParser(model.lagfart, data);

    //Tomträttshavare
    tomtratter = tomtrattParser(model.tomtratt, data);
    if (tomtratter.length) {
      inskriv.tomtratt = tomtratter;
    }

    //Tidigare Ägande
    tidigareAgare = tidigareParser(model.tidigareAgande, data);
    if (tidigareAgare.length) {
      inskriv.tidigareAgande = tidigareAgare;
    }
  }
  return inskriv;
}
