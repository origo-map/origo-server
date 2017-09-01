var config = require('../conf/config');
var objectifier = require('../lib/utils/objectifier');
var builder = require('xmlbuilder');
var request = require('request');
var parseString = require('xml2js').parseString;
var inskrivning = require('../models/inskrivning');
var translate = require('./inskrivning/translate');
var referensTranslate = require('./inskrivning/referenstranslate');
var agareTranslate = require('./inskrivning/agaretranslate');

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

  //Registerenhet
  inskriv.referens = translate(model.referens, data, referensTranslate);

  //Ägare
  inskriv.lagfart = translate(model.lagfart, data, agareTranslate);

  return inskriv;
}


module.exports = getInskrivning;
