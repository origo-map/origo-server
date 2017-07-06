var request = require('request');

module.exports = function proxyRequest(req, res, options) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  req.pipe(request.get(options)).pipe(res);
}
