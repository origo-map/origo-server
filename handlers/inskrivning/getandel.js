
module.exports = function getAndel(prop, data) {
  var andel = '';
  if (typeof data['beviljadAndel'] !== 'undefined') {
    var taljare = data['beviljadAndel']['taljare'];
    var namnare = data['beviljadAndel']['namnare'];
    andel = taljare + '/' + namnare;
  }
  return andel;
}
