var objectifier = require('../../lib/utils/objectifier');
var parser = require('./parser');
var get = require('./get');
var getAgare = require('./getagare');
var getAndel = require('./getandel');
var getIdNummer = require('./getidnummer');
var getInskrivningsdag = require('./getinskrivningsdag');
var ns = require('./conf').ns;
var tomtrattNs = ns + ':Agande.' + ns + ':Tomtrattsinnehav';

var tomtrattParser = getTomtratter;

var agareParser = {
  IDnummer: getIdNummer,
  inskrivningsdag: getInskrivningsdag,
  dagboksnummer: get,
  beslut: get,
  BeviljadAndel: getAndel,
  agare: getAgare
};

function getTomtratter(model, data) {
  var tomtratter = objectifier.get(tomtrattNs, data);
  var result = [];
  if (tomtratter) {
    if (Array.isArray(tomtratter)) {
      result = tomtratter.map(function(tomtratt) {
        return parser(model, tomtratt, agareParser);
      });
    } else {
      result = [parser(model, tomtratter, agareParser)];
    }
    return result;
  }
  return result;
}

module.exports = tomtrattParser;
