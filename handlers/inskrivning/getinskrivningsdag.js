var get = require('./get');

module.exports = function getInskrivningsdag(prop, data) {
  return get(prop, data).slice(0,10);
}
