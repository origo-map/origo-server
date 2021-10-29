module.exports = function getAgare(prop, data, model) {
  var result = {};
  var namnData;
  var personData;
  var orgData;
  var utlandskAgareData;

  namnData = data[prop];
  personData = namnData['person'];
  orgData = namnData['organisation'];
  utlandskAgareData = namnData['utlandskAgare'];

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
    var orgNamn = namnObj['organisationsnamn'];
    var efternamn = namnObj['efternamn'];
    var fornamn = namnObj['fornamn'];
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
    var utlandsk = personObj['utlandsadress'];
    var adress = getAdress(personObj);
    if (utlandsk) {
      adress = getUtlandsAdress(utlandsk);
    }
    return Object.assign(namn, adress);
  }

  function getOrg(orgObj) {
    var namn = getNamn(orgObj);
    var utlandsk = orgObj['utlandsadress'];
    var adress = getAdress(orgObj);
    if (utlandsk) {
      adress = getUtlandsAdress(utlandsk);
    }
    return Object.assign(namn, adress);
  }

  function getUtlandskAgare(utlObj) {
    var namn = getNamn(namnData);
    var adress = getUtlandsAdress(utlObj);
    return Object.assign(namn, adress);
  }

  function getAdress(personObj) {
    var adress = [];
    var adressObj = personObj['adress'];
    var sarskildAdressObj = personObj['sarskildAdress'];
    if (typeof adressObj !== 'undefined') {
      var postnummer = adressObj['postnummer'];
      var postort = adressObj['postort'];
      adress.push({
        utdelningsadress: adressObj['utdelningsadress2'],
        postadress: postnummer + ' ' + postort,
        coAdress: adressObj['coAdress']
      })
    }
    if (typeof sarskildAdressObj !== 'undefined') {
      var postnummer = sarskildAdressObj['postnummer'];
      var postort = sarskildAdressObj['postort'];
      adress.push({
        utdelningsadress: sarskildAdressObj['utdelningsadress2'],
        postadress: postnummer + ' ' + postort,
        coAdress: sarskildAdressObj['coAdress']
      })
    }

    return { adress: adress };
  }

  function getUtlandsAdress(adressObj) {
    var adress = [];
    var postadress = [];
    if (typeof adressObj !== 'undefined') {
      if (typeof adressObj['utdelningsadress2'] !== 'undefined') {
        postadress.push(adressObj['utdelningsadress2']);
      }
      if (typeof adressObj['utdelningsadress3'] !== 'undefined') {
        postadress.push(adressObj['utdelningsadress3']);
      }
      if (typeof adressObj['utdelningsadress4'] !== 'undefined') {
        postadress.push(adressObj['utdelningsadress4']);
      }
      adress.push({
        utdelningsadress: adressObj['utdelningsadress1'],
        postadress: postadress.toString(),
        land: adressObj['land']
      })
    }
    return { adress: adress };
  }
}
