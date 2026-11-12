const conf = require('../../conf/config');
const openidIssuer = require('./openidIssuer');

module.exports = async function authorize(req, res, next) {
  try {
    const params = client.callbackParams(req);

    const tokenSet = await client.callback(
      configOptions.redirect_uri,
      params,
      {
        state: req.session.oidc_state,
        code_verifier: req.session.code_verifier,
      }
    );

    req.session.userinfo = await client.userinfo(tokenSet.access_token);

    delete req.session.oidc_state;
    delete req.session.code_verifier;

    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo;

    return res.redirect(returnTo.startsWith('/') ? returnTo : '/');
  } catch (e) {
    next(e);
  }
};