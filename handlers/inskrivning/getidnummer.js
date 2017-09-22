var objectifier = require('../../lib/utils/objectifier');
var ns = require('./conf').ns;

module.exports = function getIdNummer(prop, data) {
  var idNs = ns + ':Agare.' + ns + ':' + prop;
  return objectifier.get(idNs, data);
}
