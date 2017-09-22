var parser = function parser(model, data, customParser) {
    var props = Object.keys(model);
    var result = {};
    props.forEach(function(prop) {
      if (model[prop] !== false && customParser.hasOwnProperty(prop)) {
        result[prop] = customParser[prop](prop, data, model);
      }
    });
    return result;
}

module.exports = parser;
