var objectifier = require('../../lib/utils/objectifier');

var referensTranslate = {
  objektidentitet: get,
  beteckning: get
};

function get(prop, data) {
  return objectifier.get(prop, data);
}

module.exports = referensTranslate;
