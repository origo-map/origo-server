// Optional login for changing attachments (upload and delete). With require_login: true in
// conf.attachment the user must be logged in to the map and be in ad_group (a group or a list of
// groups; default conf.auth.ad_group). Reading is always open.
//
// Origo's attachment client sends no token, but the editing maps' OIDC plugin logs in through
// /origoserver/auth/access_token, which stores the user in the session. The user is therefore read
// from the session cookie, and the map must be on the same address as origoserver.
//
// The cookie is also sent with requests from other sites (sameSite 'none'), so the request must
// also come from the map's own address (Origin), otherwise another page could upload or delete
// attachments in the user's name.
//
//   allowed_origins - addresses that may make changes, e.g. ['https://karta.sundsvall.se'].
//                     Default the same address as the server (Origin is compared with
//                     Host/X-Forwarded-Host).

const conf = require('../../conf/config');

const host = (value) => String(value || '').split(',')[0].trim().toLowerCase();

function isAllowedOrigin(origin, req, allowedOrigins) {
  if (!origin) return false;
  const normalized = origin.replace(/\/$/, '').toLowerCase();
  if (allowedOrigins.length) return allowedOrigins.includes(normalized);
  let originHost;
  try {
    originHost = new URL(normalized).host;
  } catch {
    // Among others Origin: null from a sandboxed page
    return false;
  }
  return originHost === host(req.get('x-forwarded-host') || req.get('host'));
}

// requireAdGroupMember can be replaced in tests.
module.exports = function createRequireWrite(attachmentConf = {}, {
  requireAdGroupMember = require('../auth/requireAdGroupMember'),
} = {}) {
  if (attachmentConf.require_login !== true) return (req, res, next) => next();

  if (!conf.session) {
    console.error('attachment: require_login kräver conf.session (sessionskakan från inloggningen)');
  }
  const allowedOrigins = [].concat(attachmentConf.allowed_origins || [])
    .map((origin) => String(origin).replace(/\/$/, '').toLowerCase());

  const requireMember = requireAdGroupMember({
    name: 'attachment',
    forbidden: 'Du saknar behörighet att ändra bilagor',
    adGroup: attachmentConf.ad_group,
    getUserinfo: async (req) => (req.session && req.session.userinfo) || null,
  });

  return function requireWrite(req, res, next) {
    if (!isAllowedOrigin(req.get('origin'), req, allowedOrigins)) {
      console.warn(`attachment: nekad, otillåten Origin ${JSON.stringify(req.get('origin') || null)}`);
      return res.status(403).json({ error: 'Anropet kommer från en otillåten adress' });
    }
    return requireMember(req, res, next);
  };
};

module.exports.isAllowedOrigin = isAllowedOrigin;
