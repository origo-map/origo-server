/**
 * Adds sortBy function to Array.
 *
 * Usage:
 * Array.sortBy('name');
 * Array.sortBy('name.last'); Sorting on child object key, dot syntax
 * Array.sortBy(['name', 'last']); Sorting on child object key, array syntax
 * Array.sortBy('-name'); Sorting descending
 * Array.sortBy('name', 'last'); Sorting by multiple keys
 *
 */
(function(){
    var keyPaths = [];

    var saveKeyPath = function(path) {
        keyPaths.push({
            sign: (path[0] === '+' || path[0] === '-')? parseInt(path.shift()+1) : 1,
            path: path
        });
    };

    var valueOf = function(object, path) {
        var ptr = object;
        for (var i=0,l=path.length; i<l; i++) ptr = ptr[path[i]];
        return ptr;
    };

    var comparer = function(a, b) {
        for (var i = 0, l = keyPaths.length; i < l; i++) {
            aVal = valueOf(a, keyPaths[i].path);
            bVal = valueOf(b, keyPaths[i].path);
            if (aVal > bVal) return keyPaths[i].sign;
            if (aVal < bVal) return -keyPaths[i].sign;
        }
        return 0;
    };

    Array.prototype.sortBy = function() {
        keyPaths = [];
        for (var i=0,l=arguments.length; i<l; i++) {
            switch (typeof(arguments[i])) {
                case "object": saveKeyPath(arguments[i]); break;
                case "string": saveKeyPath(arguments[i].match(/[+-]|[^.]+/g)); break;
            }
        }
        return this.sort(comparer);
    };
})();

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

module.exports = sortBy;
