var objectifier = require('../../lib/utils/objectifier');
var ns = 'ns4';
var registerNs = ns + ':Registerenhetsreferens.' + ns + ':';

var referensTranslate = {
  fastighetsnyckel: get,
  beteckning: get
};

function get(prop, data) {
  return objectifier.get(registerNs + prop, data);
}

module.exports = referensTranslate;
