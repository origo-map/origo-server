var objectifier = require('../../lib/utils/objectifier');
var translate = require('./translate');
var ns = 'ns4';
var lagfartNs = ns + ':Agande.' + ns + ':Lagfart';

var lagfarenTranslate = {
  agare: getLagfarter
};

var agareTranslate = {
  IDnummer: getIdNummer,
  inskrivningsdag: getInskrivning,
  dagboksnummer: get,
  beslut: get,
  BeviljadAndel: getAndel,
  agare: getAgare
};

function get(prop, data) {
  return objectifier.get(ns + ':' + prop, data);
}

function getInskrivning(prop, data) {
  return get(prop, data).slice(0,10);
}

function getLagfarter(prop, data, model) {
  var lagfarter = objectifier.get(lagfartNs, data);
  var result = [];
  if (Array.isArray(lagfarter)) {
    result = lagfarter.map(function(lagfart) {
      return translate(model.agare, lagfart, agareTranslate);;
    });
  } else {
    result = [translate(model.agare, lagfarter, agareTranslate)];
  }
  return result;
}

function getAndel(prop, data) {
  var andelNs = ns + ':' + prop + '.' + ns + ':';
  var taljare = objectifier.get(andelNs + 'taljare', data);
  var namnare = objectifier.get(andelNs + 'namnare', data);
  return taljare + '/' + namnare;
}

function getIdNummer(prop, data) {
  var idNs = ns + ':Agare.' + ns + ':' + prop;
  return objectifier.get(idNs, data);
}

function getAgare(prop, data, model) {
  var result = {};
  var agarNs = ns + ':Agare.';
  var personNs = agarNs + ns + ':Person.' + ns + ':';
  var adressNs = personNs + 'Adress.' + ns + ':';
  var orgNs = agarNs + ns + ':Organisation.' + ns + ':';
  var adressOrgNs = orgNs + 'Adress.' + ns + ':';

  //Om ägare är person
  if (objectifier.get(agarNs + ns + ':Person', data)) {
    var person = {};
    var efternamn = objectifier.get(personNs + 'efternamn', data);
    var fornamn = objectifier.get(personNs + 'fornamn', data);
    person.namn = efternamn + ', ' + fornamn;
    person.utdelningsadress = objectifier.get(adressNs + 'utdelningsadress2', data);
    var postnummer = objectifier.get(adressNs + 'postnummer', data);
    var postort = objectifier.get(adressNs + 'postort', data);
    person.postadress = postnummer + ' ' + postort;
    result = person;
  }

  //Om ägare är organisation
  else if (objectifier.get(agarNs + ns + ':Organisation', data)) {
    var org = {};
    org.namn = objectifier.get(orgNs + 'organisationsnamn', data);
    org.utdelningsadress = objectifier.get(adressOrgNs + 'utdelningsadress2', data);
    var postnummer = objectifier.get(adressOrgNs + 'postnummer', data);
    var postort = objectifier.get(adressOrgNs + 'postort', data);
    org.postadress = postnummer + ' ' + postort;
    result = org;
  }
  return result;
}

module.exports = lagfarenTranslate;
