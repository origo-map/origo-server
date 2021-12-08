var conf = require('../conf/config');
var objectifier = require('../lib/utils/objectifier');
var sortBy = require('../lib/utils/sortby');
var request = require('request');
var rp = require('request-promise');
const url = require('url');

// Token holder
let token;
let scope;
var proxyUrl = 'lmbuilding';

// Do the request in proper order
const lmBuilding = async (req, res) => {

  if (conf[proxyUrl]) {
    configOptions = Object.assign({}, conf[proxyUrl]);
    scope = configOptions.scope;

    //Get a token from LM
    await getTokenAsyncCall(configOptions.consumer_key, configOptions.consumer_secret, configOptions.scope);

    //Do a POST with all the IDs from free search to get the complete objects with geometry
    await doGetAsyncCall(req, res, configOptions, proxyUrl);

  }

}

// Export the module
module.exports = lmBuilding;

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

async function doGetAsyncCall(req, res, configOptions, proxyUrl) {

  // Use either byggnad objektidentitet or fastighet objektidentitet
  var searchUrl = req.url;
  var searchMethod = searchUrl.includes("registerenhet");

  var options = {};
  //var id;;
  //var searchArray = req.url.split('/');
  var objektList = [];

  if(searchMethod){
    // Fastighet objektidentitet
    //id = decodeURI(searchArray[4]);
    var id = objectifier.get('query.registerenhet', req) || '';
    var options1 = {
        url: encodeURI(configOptions.url + '/referens/registerenhet/' + id + '?includeData=total'),
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'scope': `${scope}`
        },
        json: true // Automatically parses the JSON string in the response
    }
    objektList = await getObjektArr(options1);

    if (objektList.length > 0) {
      // Setup the call for getting the objects found in search and wait for result
      options = {
        method: 'POST',
        url: encodeURI(configOptions.url + '/?includeData=total'),
        body: objektList,
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'scope': `${scope}`
        },
        json: true
      };
      await getBuildingInformation(req, res, options, objektList, id);

    } else {
      console.log('No buildings object!');
      res.render('lmbuildingerror', {
        fid: fid
      });
    }
    objektList = [];

  } else {
    // Byggnad objektidentitet
    //id = decodeURI(searchArray[3]);
    var id = objectifier.get('query.uuid', req) || '';
    objektList.push(id)

    options = {
      method: 'POST',
      url: encodeURI(configOptions.url + '/?includeData=total'),
      body: objektList,
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'scope': `${scope}`
      },
      json: true
    };
    await getBuildingInformation(req, res, options, objektList, id);
    objektList = [];
  }
}

function getObjektArr(options) {
  return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
          if (error) {
            console.log('Error get list of buildings: ' + error);
          } else {
            const objList = [];
            body.forEach(function(item, index, array) {
              objList.push(item.objektidentitet)
            })
            resolve(objList);
          }
      })
  })
}

function getBuildingInformation(req, res, options, objektList, fid) {
  rp(options)
  .then(function (parsedBody) {
    let feat = parsedBody.features;
    feat.sortBy('properties.byggnadsattribut.husnummer');
    res.render('lmbuilding', parsedBody);
  })
  .catch(function (err) {
    console.log(err);
    console.log('ERROR getBuilding!');
    res.render('lmbuildingerror', {
      fid: fid
    });
  });
}
