var objectifier = require('../../lib/utils/objectifier');
var parser = require('./parser');
var get = require('./get');
var getAgare = require('./getagare');
var getAndel = require('./getandel');
var getIdNummer = require('./getidnummer');
var getInskrivningsdag = require('./getinskrivningsdag');

var tomtrattParser = getTomtratter;

var agareParser = {
  idnummer: getIdNummer,
  inskrivningsdag: getInskrivningsdag,
  dagboksnummer: get,
  beslut: get,
  beviljadAndel: getAndel,
  agare: getAgare
};

function getTomtratter(model, data) {
  var agande = objectifier.get('agande', data);
  var tomtratter = [];
  if (Array.isArray(agande)) {
    agande.forEach(function(element) {
      if (element.typ === 'Tomträttsinnehav') {
        tomtratter.push(element);
      }
    })
  } else {
    if (agande.typ === 'Tomträttsinnehav') {
      tomtratter.push(data);
    }
  }
  var result = [];
  if (tomtratter) {
    result = tomtratter.map(function(tomtratt) {
      return parser(model, tomtratt, agareParser);
    });
    return result;
  }
  return result;
}

module.exports = tomtrattParser;
