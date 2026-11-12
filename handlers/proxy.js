var conf = require('../conf/config');
var proxyRequest = require('../lib/proxyrequest');

// Whitelist of allowed urls in conf.proxy.allowedUrls. If missing or empty, all requests are denied.
var allowedUrls = parseAllowedUrls((conf.proxy && conf.proxy.allowedUrls) || []);

module.exports = function proxy(req, res) {
  var url;
  if (!req.query.url) {
    return sendError(res, 400, 'Invalid proxy url');
  }
  url = toAllowedUrl(buildUrl(req.query));
  if (!url) {
    console.warn('Proxy: url not allowed', req.query.url);
    return sendError(res, 403, 'Url not allowed');
  }
  proxyRequest(req, res, {
    url: url,
    // Only follow redirects that also point to an allowed url
    followRedirect: function(response) {
      var location = response.headers.location;
      if (!location) {
        return false;
      }
      try {
        return Boolean(toAllowedUrl(new URL(location, response.request.uri.href).href));
      } catch (e) {
        return false;
      }
    }
  });
}

function sendError(res, status, body) {
  res.writeHead(status, {
    'Content-Length': Buffer.byteLength(body),
    'Content-Type': 'text/plain'
  });
  res.end(body);
}

function parseAllowedUrls(urls) {
  return urls.map(function(allowed) {
    var parsed = new URL(allowed);
    return {
      protocol: parsed.protocol,
      host: parsed.host,
      pathname: parsed.pathname
    };
  });
}

// Returns the normalized url if it matches the whitelist, otherwise null.
// Protocol and host (including port) must match exactly, and the path must start with
// the allowed path, compared by whole segments.
function toAllowedUrl(urlString) {
  var target;
  try {
    target = new URL(urlString);
  } catch (e) {
    return null;
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return null;
  }
  if (target.username || target.password) {
    return null;
  }
  var isAllowed = allowedUrls.some(function(allowed) {
    if (allowed.protocol !== target.protocol || allowed.host !== target.host) {
      return false;
    }
    if (allowed.pathname === '/' || target.pathname === allowed.pathname) {
      return true;
    }
    var prefix = allowed.pathname.endsWith('/') ? allowed.pathname : allowed.pathname + '/';
    return target.pathname.startsWith(prefix);
  });
  // Use the normalized url so that exactly the checked address is requested
  return isAllowed ? target.href : null;
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
  if (url.search("application/vnd.ogc.gml")) {
    url.replace('application/vnd.ogc.gml', 'application/vnd.ogc.wms_xml');
  }
  return url;
}
