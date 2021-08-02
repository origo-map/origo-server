const conf = require('../../conf/config');
const { Issuer, custom } = require('openid-client');

if (conf.auth.http_timeout) {
  custom.setHttpOptionsDefaults({
    timeout: conf.auth.http_timeout
  });
}

let client = undefined;

const getOpenidClient = async () => {
  if (client) {
    return client;
  }
  const issuer = await Issuer.discover(conf.auth.openidIssuer);
  client = new issuer.Client({
    client_id: conf.auth.client_id,
    client_secret: conf.auth.client_secret,
    redirect_uris: [conf.auth.redirect_uri],
    response_types: ['code'],
    grant_types: ['authorization_code', 'refresh_token']
  });
  return client;
};

module.exports = {
  getOpenidClient
};
