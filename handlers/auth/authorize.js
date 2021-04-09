const conf = require('../../conf/config');
const openidIssuer = require('./openidIssuer');

module.exports = async function authorize(req, res) {
  try {
    const client = await openidIssuer.getOpenidClient();
    const authorizationUrl = client.authorizationUrl({
      redirect_uri: conf.auth.redirect_uri,
      response_type: 'code',
      scope: 'openid',
    });
    res.redirect(authorizationUrl);
  } catch (e) {
    console.error(e.toString());
    res.status(500).send('authorize error');
  }
};
