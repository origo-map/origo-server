var Objectifier = function() {

  // Utility method to get and set objects that may or may not exist
  var objectifier = function(splits, obj, create) {
    var result = obj || {};
    for (var i = 0, s; result && (s = splits[i]); i++) {
      result = (s in result ? result[s] : (create ? result[s] = {} : undefined));
    }
    return result;
  };

  function find(name, obj) {
    var objects = [];
    for (var key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      if (key === name) { //
        objects.push(obj[key]);
        break;
      } else if (typeof obj[key] === 'object') {
        objects = objects.concat(find(name, obj[key]));
      }
    }
    return objects;
  }

  return {
		
    // Creates an object if it doesn't already exist
    set: function(name, obj, value) {
      var splits = name.split('.'),
        s = splits.pop(),
        result = objectifier(splits, obj, true);
      return result && s ? (result[s] = value) : undefined;
    },
    get: function(name, obj, create) {
      return objectifier(name.split('.'), obj, create);
    },
    find: function(name, obj) {
      var match = find(name, obj);
      return match.length > 0 ? match[0] : undefined;
    },
    exists: function(name, obj) {
      return this.get(name, false, obj) !== undefined;
    }
  };

}

module.exports = Objectifier();
