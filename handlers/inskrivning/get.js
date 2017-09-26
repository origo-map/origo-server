var objectifier = require('../../lib/utils/objectifier');
var ns = require('./conf').ns;

module.exports = function get(prop, data) {
  return objectifier.get(ns + ':' + prop, data);
}
