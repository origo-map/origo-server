var objectifier = require('../../lib/utils/objectifier');
var ns = require('./conf').ns;

module.exports = function getAgare(prop, data, model) {
  var result;
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
