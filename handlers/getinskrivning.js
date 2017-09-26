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

var getInskrivning = function(req, res) {

  var fnr = objectifier.get('query.fnr', req) || '';

  var options = {
    'v2:IncludeData': {
      'v2:agare': true
    }
  };
  var url = config.getInskrivning.url,
    user = config.getInskrivning.user,
    password = config.getInskrivning.password;

  var xml = builder.create('soap:Envelope')
    .att('xmlns:soap', 'http://www.w3.org/2003/05/soap-envelope')
    .att('xmlns:v2', 'http://namespace.lantmateriet.se/distribution/produkter/inskrivning/v2.1')
    .ele('soap:Header')
    .insertAfter('soap:Body')
    .ele('v2:GetInskrivningRequest')
    .ele('v2:InskrivningRegisterenhetFilter')
    .ele('v2:fastighetsnyckel')
    .txt(fnr)
    .up()
    .up()
    .ele(options)
    .end({
      pretty: true
    });

  request.post({
      url: url,
      body: xml,
      auth: {
        user: user,
        pass: password
      },
      headers: {
        'Content-Type': 'application/soap+xml'
      }
    },
    function(error, response, body) {
      var json;
      parseString(body, {
        explicitArray: false,
        ignoreAttrs: true
      }, function(err, result) {
        json = result;
      });
      if (objectifier.find('env:Fault', json) || error) {
        res.render('inskrivningerror', {
          fnr: fnr
        });
      } else {
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
