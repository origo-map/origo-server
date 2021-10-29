var objectifier = require('../../lib/utils/objectifier');
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

var sortBy = (function () {
  var toString = Object.prototype.toString,
      // default parser function
      parse = function (x) { return x; },
      // gets the item to be sorted
      getItem = function (x) {
        var isObject = x != null && typeof x === "object";
        var isProp = isObject && this.prop in x;
        return this.parser(isProp ? x[this.prop] : x);
      };

  /**
   * Sorts an array of elements.
   *
   * @param  {Array} array: the collection to sort
   * @param  {Object} cfg: the configuration options
   * @property {String}   cfg.prop: property name (if it is an Array of objects)
   * @property {Boolean}  cfg.desc: determines whether the sort is descending
   * @property {Function} cfg.parser: function to parse the items to expected type
   * @return {Array}
   */
  return function sortby (array, cfg) {
    if (!(array instanceof Array && array.length)) return [];
    if (toString.call(cfg) !== "[object Object]") cfg = {};
    if (typeof cfg.parser !== "function") cfg.parser = parse;
    cfg.desc = !!cfg.desc ? -1 : 1;
    return array.sort(function (a, b) {
      a = getItem.call(cfg, a);
      b = getItem.call(cfg, b);
      return cfg.desc * (a < b ? -1 : +(a > b));
    });
  };

}());

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
