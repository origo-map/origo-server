var objectifier = require('../../lib/utils/objectifier');
var parser = require('./parser');
var get = require('./get');
var getAgare = require('./getagare');
var getAndel = require('./getandel');
var getIdNummer = require('./getidnummer');
var getInskrivningsdag = require('./getinskrivningsdag');

var lagfarenParser = getLagfarter;

var agareParser = {
  idnummer: getIdNummer,
  inskrivningsdag: getInskrivningsdag,
  dagboksnummer: get,
  beslut: get,
  beviljadAndel: getAndel,
  agare: getAgare
};

function getLagfarter(model, data) {
  var agande = objectifier.get('agande', data);
  var lagfarter = [];
  if (Array.isArray(agande)) {
    agande.forEach(function(element) {
      if (element.typ === 'Lagfart') {
        lagfarter.push(element);
      }
    })
  } else {
    if (typeof agande !== 'undefined') {
      if (agande.typ === 'Lagfart') {
        lagfarter.push(agande);
      }
    }
  }
  var result = [];
  if (lagfarter) {
    result = lagfarter.map(function(lagfart) {
      return parser(model, lagfart, agareParser);
    });
    return result;
  }
  return result;
}

module.exports = lagfarenParser;
