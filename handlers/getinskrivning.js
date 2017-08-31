var config = require('../conf/config');
var objectifier = require('../lib/utils/objectifier');
var builder = require('xmlbuilder');
var request = require('request');
var parseString = require('xml2js').parseString;
var inskrivning = require('../models/inskrivning');

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
  var inskriv = inskrivning();

  //Registerenhet
  inskriv.beteckning = objectifier.get('ns4:Registerenhetsreferens.ns4:beteckning', data);

  //Lagfarter
  var lagfarter = objectifier.get('ns4:Agande.ns4:Lagfart', data);
  if (Array.isArray(lagfarter)) {
    inskriv.lagfart = lagfarter.map(function(lagfart) {
      return formatLagfart(lagfart);
    });
  } else {
    inskriv.lagfart = [formatLagfart(lagfarter)];
  }

  return inskriv;
}

function formatLagfart(obj) {
  var rObj = {};

  //Ägare
  var agare = objectifier.get('ns4:Agare', obj);

  //Om ägare är person
  if (objectifier.get('ns4:Person', agare)) {
    var person = {};
    var efternamn = objectifier.get('ns4:Person.ns4:efternamn', agare);
    var fornamn = objectifier.get('ns4:Person.ns4:fornamn', agare);
    person.namn = efternamn + ', ' + fornamn;
    person.utdelningsadress = objectifier.get('ns4:Person.ns4:Adress.ns4:utdelningsadress2', agare);
    var postnummer = objectifier.get('ns4:Person.ns4:Adress.ns4:postnummer', agare);
    var postort = objectifier.get('ns4:Person.ns4:Adress.ns4:postort', agare);
    person.postadress = postnummer + ' ' + postort;
    rObj.agare = person;
  }

  //Om ägare är organisation
  else if (objectifier.get('ns4:Organisation', agare)) {
    var org = {};
    org.namn = objectifier.get('ns4:Organisation.ns4:organisationsnamn', agare);
    org.utdelningsadress = objectifier.get('ns4:Organisation.ns4:Adress.ns4:utdelningsadress2', agare);
    var postnummer = objectifier.get('ns4:Organisation.ns4:Adress.ns4:postnummer', agare);
    var postort = objectifier.get('ns4:Organisation.ns4:Adress.ns4:postort', agare);
    org.postadress = postnummer + ' ' + postort;
    rObj.agare = org;
  }

  //Andel
  var taljare = objectifier.get('ns4:BeviljadAndel.ns4:taljare', obj);
  var namnare = objectifier.get('ns4:BeviljadAndel.ns4:namnare', obj);
  rObj.andel = taljare + '/' + namnare;

  return rObj;
}

module.exports = getInskrivning;
