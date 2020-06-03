var config = require('../conf/config');
var objectifier = require('../lib/utils/objectifier');
var builder = require('xmlbuilder');
var request = require('request');
var parseString = require('xml2js').parseString;
var inskrivning = require('../models/inskrivning');
var parser = require('./inskrivning/parser');
var referensParser = require('./inskrivning/referensparser');
var lagfartParser = require('./inskrivning/lagfartparser');
var tomtrattParser = require('./inskrivning/tomtrattparser');
var getToken = require('../lib/tokenrequest');
var token;

var getInskrivning = async (req, res) => {

  // Use either fastighetsnyckel or objektidentitet as querystring to get estate information, fastighetsnyckel is deprecated
  var fnr = objectifier.get('query.fnr', req) || '';
  var objektid = objectifier.get('query.objektid', req) || '';
  var fid = fnr ? fnr : objektid;
  var idStr = fnr ? 'fastighetsnyckel' : 'objektidentitet';

  var options = {
    'v2:IncludeData': {
      'v2:agare': true
    }
  };

  var url = config.getInskrivning.url;
  var url_token = config.getInskrivning.url_token;
  var consumer_key = config.getInskrivning.consumer_key;
  var consumer_secret = config.getInskrivning.consumer_secret;
  var scope = config.getInskrivning.scope;

  await getToken(url_token, consumer_key, consumer_secret, scope)
    .then(JSON.parse)
    .then((result) => {
      token = result.access_token;
    })
    .catch((err) => {
      console.log(err);
    });


  var xml = builder.create('soap:Envelope')
    .att('xmlns:soap', 'http://www.w3.org/2003/05/soap-envelope')
    .att('xmlns:v2', 'http://namespace.lantmateriet.se/distribution/produkter/inskrivning/v2.1')
    .ele('soap:Header')
    .insertAfter('soap:Body')
    .ele('v2:GetInskrivningRequest')
    .ele('v2:InskrivningRegisterenhetFilter')
    .ele('v2:' + idStr)
    .txt(fid)
    .up()
    .up()
    .ele(options)
    .end({
      pretty: true
    });

  request.post({
    url: url,
    body: xml,
    headers: {
      'Content-Type': 'application/soap+xml',
      'Authorization': `Bearer ${token}`
    }
  }, function (error, response, body) {
    var json;
    parseString(body, {
      explicitArray: false,
      ignoreAttrs: true
    }, function (err, result) {
      json = result;
    });
    if (objectifier.find('env:Fault', json) || error) {
      res.render('inskrivningerror', {
        fid: fid
      });
    }
    else {
      var inskrivning = parseResult(json);
      res.render('inskrivning', inskrivning);
    }
  });
}

function parseResult(result) {
  var data = objectifier.find('ns4:Inskrivningsinformation', result);
  var model = inskrivning();
  var inskriv = {};
  var tomtratter;

  //Registerenhet
  inskriv.referens = parser(model.referens, data, referensParser);

  //Ägare
  inskriv.lagfart = lagfartParser(model.lagfart, data);

  //Tomträttshavare
  tomtratter = tomtrattParser(model.tomtratt, data);
  if (tomtratter.length) {
    inskriv.tomtratt = tomtratter;
  }

  return inskriv;
}


module.exports = getInskrivning;
