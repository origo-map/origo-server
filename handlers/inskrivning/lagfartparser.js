var objectifier = require('../../lib/utils/objectifier');
var parser = require('./parser');
var get = require('./get');
var getAgare = require('./getagare');
var getAndel = require('./getandel');
var getIdNummer = require('./getidnummer');
var getInskrivningsdag = require('./getinskrivningsdag');
var ns = require('./conf').ns;
var lagfartNs = ns + ':Agande.' + ns + ':Lagfart';

var lagfarenParser = getLagfarter;

var agareParser = {
  IDnummer: getIdNummer,
  inskrivningsdag: getInskrivningsdag,
  dagboksnummer: get,
  beslut: get,
  BeviljadAndel: getAndel,
  agare: getAgare
};

function getLagfarter(model, data) {
  var lagfarter = objectifier.get(lagfartNs, data);
  var result = [];
  if (Array.isArray(lagfarter)) {
    result = lagfarter.map(function(lagfart) {
      return parser(model, lagfart, agareParser);;
    });
  } else {
    result = [parser(model, lagfarter, agareParser)];
  }
  return result;
}

module.exports = lagfarenParser;
