var objectifier = require('../../lib/utils/objectifier');
var ns = require('./conf').ns;

module.exports = function getAgare(prop, data, model) {
  var result = {};
  var agarNs = ns + ':Agare.';
  var namnData;
  var personData;
  var orgData;
  var utlandskAgareData;

  namnData = objectifier.get(agarNs, data);
  personData = objectifier.get(agarNs + ns + ':Person', data);
  orgData = objectifier.get(agarNs + ns + ':Organisation', data);
  utlandskAgareData = objectifier.get(agarNs + ns + ':UtlandskAgare', data);

  if (personData) {
    result = getPerson(personData);
  } else if (orgData) {
    result = getOrg(orgData);
  } else if (utlandskAgareData) {
    result = getUtlandskAgare(utlandskAgareData);
  } else {
    result = getNamn(namnData);
  }

  // Uppgift saknas om skyddad identitet. Skyddad identitet har efternamn = "SKYDDAD IDENTITET"
  if (result.namn === 'SKYDDAD PERSONUPPGIFT') {
    result.namn = 'Uppgift saknas';
  } 

  return result;

  function getNamn(namnObj) {
    var namn = {};
    var orgNamn = objectifier.get(ns + ':organisationsnamn', namnObj);
    var efternamn = objectifier.get(ns + ':efternamn', namnObj);
    var fornamn =  objectifier.get(ns + ':fornamn', namnObj);
    if (efternamn && fornamn) {
      namn.namn = efternamn + ', ' + fornamn;
    } else if (orgNamn) {
      namn.namn = orgNamn;
    } else if (efternamn) {
      namn.namn = efternamn;
    }
    return Object.assign(namn);
  }

  function getPerson(personObj) {
    var namn = getNamn(namnData);
    var utlandsk = objectifier.get(ns + ':Utlandsadress', personObj);
    var adress = getAdress(personObj[ns + ':Adress']);
    if (utlandsk) {
      adress = getUtlandsAdress(utlandsk);
    }
    return Object.assign(namn, adress);
  }

  function getOrg(orgObj) {
    var namn = getNamn(namnData);
    var utlandsk = objectifier.get(ns + ':Utlandsadress', orgObj);
    var adress = getAdress(orgObj[ns + ':Adress']);
    if (utlandsk) {
      adress = getUtlandsAdress(utlandsk);
    }
    return Object.assign(namn, adress);
  }

  function getUtlandskAgare(utlObj) {
    var namn = getNamn(namnData);
    var adress = getUtlandskAgareAdress(utlObj);
    return Object.assign(namn, adress);
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

  function getUtlandsAdress(adressObj) {
    var adress = {};
    adress.utdelningsadress = objectifier.get(ns + ':utdelningsadress1', adressObj);
    adress.postadress = objectifier.get(ns + ':utdelningsadress3', adressObj);
    adress.land = objectifier.get(ns + ':land', adressObj);
    return adress;
  }

  function getUtlandskAgareAdress(adressObj) {
    var adress = {};
    adress.utdelningsadress = objectifier.get(ns + ':utdelningsadress', adressObj);
    var postkod =  objectifier.get(ns + ':postkod', adressObj);
    var postort =  objectifier.get(ns + ':postort', adressObj);
    adress.postadress = postkod + ' ' + postort;
    adress.land = objectifier.get(ns + ':land', adressObj);
    return adress;
  }
}
