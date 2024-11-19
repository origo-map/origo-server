const proxy = require('express-http-proxy');
const lmtokenhandler = require('../handlers/lmtokenhandler');

const lmApiProxy = function(proxyOptions) {
  return proxy(proxyOptions.url, {
    https: true,
    proxyReqOptDecorator: async (proxyReqOpts, srcReq) => {
      const tokenObject = await lmtokenhandler(proxyOptions);
      proxyReqOpts.headers['Authorization'] = `Bearer ${tokenObject.token}`;
      return proxyReqOpts;
    }
  })
}

module.exports = lmApiProxy;