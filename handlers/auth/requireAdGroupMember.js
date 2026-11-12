const conf = require('../../conf/config');
const { userFromRequest } = require('./bearer');
const { isConfigured, getGroupMembers, cachedGroupMembers } = require('./adGroups');

// Middleware that requires a logged-in user (by default an access token in Authorization:
// Bearer …) who is a member of an AD group. Used by report-issues, the Matomo statistics page,
// dialogkarta and attachment. The AD account for the lookups, the default group and the claim
// with the username are set in conf.auth (see adGroups.js).
// Sets req.user = { username, userinfo }.
//
//   name       - name in the logs, e.g. 'report-issues'
//   forbidden  - the error message when the user is not in the group
//   sendError  - sends an error, default { error: message }
//   adGroup    - the AD group, or a list of groups where membership in any of them is enough.
//                Default conf.auth.ad_group. Members of nested groups count.
//   getUserinfo - gets the logged-in user's userinfo from the request, or null. Default the
//                access token in the Authorization header; attachment uses the session instead.
module.exports = function requireAdGroupMember({
  name,
  forbidden = 'Du saknar behörighet',
  sendError = (res, status, message) => res.status(status).json({ error: message }),
  adGroup,
  getUserinfo = userFromRequest,
}) {
  const authConf = conf.auth || {};

  // The claim in userinfo with the AD username (sAMAccountName). The login service sends it in
  // sub; username_claim in conf.auth can point to another claim.
  const usernameClaim = authConf.username_claim || 'sub';
  const configured = [].concat(adGroup || []).filter(Boolean);
  const groups = configured.length ? configured : [].concat(authConf.ad_group || []).filter(Boolean);

  // The members of the group, or null if AD doesn't answer and the group has never been fetched.
  async function membersOf(group) {
    try {
      return await getGroupMembers(group);
    } catch (err) {
      // Better a somewhat old list than locking everyone out when AD doesn't answer
      const members = cachedGroupMembers(group);
      if (!members) console.error(`${name}: kunde inte hämta gruppen ${group} från AD:`, err.message || err);
      return members;
    }
  }

  return async function requireMember(req, res, next) {
    if (!conf.auth) {
      return sendError(res, 500, 'Inloggning är inte konfigurerad (conf.auth saknas)');
    }
    if (groups.length === 0) {
      console.error(`${name}: ingen AD-grupp är inställd`);
      return sendError(res, 500, 'Inloggning är inte konfigurerad (AD-grupp saknas)');
    }
    if (!isConfigured()) {
      console.error(`${name}: AD-kontot saknas (ad_url och ad_password i conf.auth)`);
      return sendError(res, 500, 'Inloggning är inte konfigurerad (AD-uppslag saknas)');
    }

    let userinfo;
    try {
      userinfo = await getUserinfo(req);
    } catch (err) {
      console.error(`${name}: kunde inte verifiera token:`, err.message || err);
      return sendError(res, 503, 'Kunde inte verifiera inloggningen');
    }
    if (!userinfo) {
      res.set('WWW-Authenticate', 'Bearer');
      return sendError(res, 401, 'Inloggning krävs');
    }

    const username = String(userinfo[usernameClaim] || '');
    const isMember = (members) => members
      && members.some((member) => member.username.toLowerCase() === username.toLowerCase());
    // The groups are fetched in parallel; each is cached separately in adGroups.
    const memberLists = await Promise.all(groups.map(membersOf));

    if (!username || !memberLists.some(isMember)) {
      // If a group couldn't be fetched the user may be in it, so the answer is 503, not 403.
      if (username && memberLists.includes(null)) {
        return sendError(res, 503, 'Kunde inte kontrollera behörighet');
      }
      console.warn(`${name}: nekad, användaren ${JSON.stringify(username)} (claim ${usernameClaim}) finns inte i ${groups.join(', ')}. Claims: ${Object.keys(userinfo).join(', ')}`);
      return sendError(res, 403, forbidden);
    }

    req.user = { username, userinfo };
    return next();
  };
};
