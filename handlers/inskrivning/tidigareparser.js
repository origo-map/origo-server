var objectifier = require('../../lib/utils/objectifier');
var sortBy = require('../../lib/utils/sortby');
var parser = require('./parser');
var get = require('./get');
var getAgare = require('./getagare');
var getAndel = require('./getandel');
var getIdNummer = require('./getidnummer');
var getInskrivningsdag = require('./getinskrivningsdag');

var tidigareParser = getTidigareAgare;

var agareParser = {
  idnummer: getIdNummer,
  inskrivningsdag: getInskrivningsdag,
  dagboksnummer: get,
  beslut: get,
  beviljadAndel: getAndel,
  agare: getAgare,
  typ: get
};

function getTidigareAgare(model, data) {
  var tidigareAgande = objectifier.get('tidigareAgande', data);
  var result = [];
  if (tidigareAgande) {
    if (Array.isArray(tidigareAgande)) {
      sortBy(tidigareAgande, { prop: "inskrivningsdag", desc: true });
      result = tidigareAgande.map(function(tidigare) {
        return parser(model, tidigare, agareParser);
      });
    } else {
      result = [parser(model, tidigareAgande, agareParser)];
    }
    return result;
  }

  return result;
}

module.exports = tidigareParser;
