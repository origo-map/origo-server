var objectifier = require('../../lib/utils/objectifier');
var ns = require('./conf').ns;

module.exports = function getAndel(prop, data) {
  var andelNs = ns + ':' + prop + '.' + ns + ':';
  var taljare = objectifier.get(andelNs + 'taljare', data);
  var namnare = objectifier.get(andelNs + 'namnare', data);
  return taljare + '/' + namnare;
}
