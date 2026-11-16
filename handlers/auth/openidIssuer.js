const conf = require('../../conf/config');
const { Issuer, custom } = require('openid-client');

// conf.auth may be missing. The module is still loaded by requireAdGroupMember, which then
// responds with an error instead of logging in.
if (conf.auth && conf.auth.http_timeout) {
  custom.setHttpOptionsDefaults({
    timeout: conf.auth.http_timeout
  });
}

let client = undefined;
// Endpoints from the discovery that created client, for logging.
let endpoints = {};

const getOpenidClient = async () => {
  if (client) {
    return client;
  }
  if (!conf.auth) {
    throw new Error('Login is not configured (conf.auth is missing)');
  }
  const issuer = await Issuer.discover(conf.auth.openidIssuer);
  endpoints = {
    token_endpoint: issuer.token_endpoint,
    userinfo_endpoint: issuer.userinfo_endpoint
  };
  console.log('openid discovery done', { issuer: issuer.issuer, ...endpoints });
  client = new issuer.Client({
    client_id: conf.auth.client_id,
    client_secret: conf.auth.client_secret,
    redirect_uris: [conf.auth.redirect_uri],
    response_types: ['code'],
    grant_types: conf.auth.grant_types ?? ['authorization_code', 'refresh_token']
  });
  return client;
};

// True when no HTTP response came back: openid-client's own timeout (an RPError without a code)
// or a socket error such as ETIMEDOUT, ECONNRESET or ENOTFOUND. Errors with a response
// (e.g. invalid_grant) come from the login service itself and are not network errors.
const isNetworkError = (err) =>
  Boolean(err) && !err.response && (Boolean(err.code) || /timed out/i.test(err.message || ''));

// The client is cached for the life of the process, so a stale endpoint or a broken connection
// otherwise lasts until the container is restarted. On a network error the client is dropped and
// the next request does discovery again. Returns true if the client was dropped.
const resetOnNetworkError = (err, endpoint) => {
  if (!client || !isNetworkError(err)) {
    return false;
  }
  console.error('openid network error, client reset; next request does discovery again', {
    endpoint: endpoints[endpoint],
    error: err.code || err.message
  });
  client = undefined;
  return true;
};

module.exports = {
  getOpenidClient,
  isNetworkError,
  resetOnNetworkError
};
