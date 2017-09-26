var objectifier = require('../../lib/utils/objectifier');
var ns = require('./conf').ns;

module.exports = function getAgare(prop, data, model) {
  var result = {};
  var agarNs = ns + ':Agare.';
  var personData;
  var orgData;

  personData = objectifier.get(agarNs + ns + ':Person', data);
  orgData = objectifier.get(agarNs + ns + ':Organisation', data);

  if (personData) {
    result = getPerson(personData);
  } else if (orgData) {
    result = getOrg(orgData);
  }

  // Uppgift saknas tex om skyddad identitet. Skyddad identitet har efternamn = "SKYDDAD IDENTITET"
  if (!result.namn) {
    result.namn = 'Uppgift saknas';
  }

  return result;

  function getPerson(personObj) {
    var person = {};
    var utlandsk = objectifier.get(ns + ':Utlandsadress', personObj);
    var efternamn = objectifier.get(ns + ':efternamn', personObj);
    var fornamn =  objectifier.get(ns + ':fornamn', personObj);
    var adress = getAdress(personObj[ns + ':Adress']);
    if (efternamn && fornamn) {
      person.namn = efternamn + ', ' + fornamn;
    }
    if (utlandsk) {
      adress = getUtlandskAdress(utlandsk);
    }
    return Object.assign(person, adress);
  }

  function getOrg(orgObj) {
    var org = {};
    var utlandsk = objectifier.get(ns + ':Utlandsadress', orgObj);
    var adress = getAdress(orgObj[ns + ':Adress']);
    org.namn = objectifier.get(ns + ':organisationsnamn', orgObj);
    if (utlandsk) {
      adress = getUtlandskAdress(utlandsk);
    }
    return Object.assign(org, adress);
  }

  function getAdress(adressObj) {
    var adress = {};
    var postnummer = objectifier.get(ns + ':postnummer', adressObj);
    var postort = objectifier.get(ns + ':postort', adressObj);
    var coAdress;
    adress.utdelningsadress = objectifier.get(ns + ':utdelningsadress2', adressObj);
    adress.postadress = postnummer + ' ' + postort;
    adress.coAdress = objectifier.get(ns + ':coAdress', adressObj);
    return adress;
  }

  function getUtlandskAdress(adressObj) {
    var adress = {};
    adress.utdelningsadress = objectifier.get(ns + ':utdelningsadress1', adressObj);
    adress.postadress = objectifier.get(ns + ':utdelningsadress3', adressObj);
    adress.land = objectifier.get(ns + ':land', adressObj);
    return adress;
  }
}
