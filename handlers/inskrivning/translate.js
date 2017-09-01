var referens = function referens(model, data, translater) {
    var props = Object.keys(model);
    var result = {};
    props.forEach(function(prop) {
      if (model[prop] !== false && translater.hasOwnProperty(prop)) {
        result[prop] = translater[prop](prop, data, model);
      }
    });
    return result;
}

module.exports = referens;
