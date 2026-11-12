const crypto = require('crypto');
const openidIssuer = require('./openidIssuer');

const CACHE_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 1000;

// sha256(token) -> { at, userinfo }
const cache = new Map();

function bearerToken(req) {
  const match = (req.headers.authorization || '').match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}

// Validerar access-token i Authorization-headern genom att hämta användaren från
// inloggningstjänstens userinfo-endpoint. Svaret cachas en stund så att inte varje anrop
// går till inloggningstjänsten. Returnerar userinfo, eller null om token saknas/är ogiltig.
// Kastar om inloggningstjänsten inte går att nå.
async function userFromRequest(req) {
  const token = bearerToken(req);
  if (!token) return null;

  const key = crypto.createHash('sha256').update(token).digest('hex');
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.userinfo;

  const client = await openidIssuer.getOpenidClient();
  let userinfo;
  try {
    userinfo = await client.userinfo(token);
  } catch (err) {
    const status = err.response && err.response.statusCode;
    if (status >= 400 && status < 500) {
      cache.delete(key);
      return null;
    }
    throw err;
  }

  if (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value);
  cache.set(key, { at: Date.now(), userinfo });
  return userinfo;
}

module.exports = {
  userFromRequest
};
