var request = require('request');
var proxyUrl = require('../conf/config').proxy.proxyUrl;
var proxyRequest = require('../lib/proxyrequest');

module.exports = function proxy(req, res) {
  var url;
  var body;
  var url;
  if (req.query.url) {
    url = buildUrl(req.query);
    proxyRequest(req, res, {
      url: url
    });
  } else {
    body = 'Invalid proxy url';
    res.writeHead(400, {
      'Content-Length': body.length,
      'Content-Type': 'text/plain'
    });
    res.write(body);
    res.end();
  }
}

function buildUrl(params) {
  var url = Object.keys(params).reduce(function(prev, curr) {
    if (curr === 'url') {
      prev = params[curr] + '?' + prev;
    } else if (curr.length) {
      prev = prev + '&' + curr + '=' + params[curr];
    }
    return prev;
  }, '');
  return url;
}
