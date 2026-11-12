const conf = require('../../conf/config');
const fs = require('fs');
const path = require('path');
const ActiveDirectory = require('activedirectory2');

// Members of AD groups, looked up with the AD account in conf.auth (ad_url, ad_base_dn,
// ad_username, ad_password, ad_ca_file, ad_cache_minutes). Used by requireAdGroupMember and by
// report-issues for the list of case officers.

// conf.auth may be missing; the lookups then fail instead of the server not starting.
const adConf = () => conf.auth || {};
const cacheMs = () => (adConf().ad_cache_minutes || 15) * 60 * 1000;

// userAccountControl flag for a disabled account
const ACCOUNTDISABLE = 0x2;

// Per group: { at, users }
const caches = new Map();

// The AD server has a certificate from the municipality's internal CA, which Node doesn't trust
// by default. A relative path is resolved from the server's root folder. Read on the first call,
// so a missing file only breaks the AD lookups and not the whole server.
let tlsOptions;
function getTlsOptions() {
  const { ad_ca_file: caFile } = adConf();
  if (!caFile) return undefined;
  if (!tlsOptions) {
    const caPath = path.resolve(__dirname, '../..', caFile);
    tlsOptions = { ca: fs.readFileSync(caPath) };
  }
  return tlsOptions;
}

// true if the AD account for the lookups is set in conf.auth
function isConfigured() {
  const { ad_url: url, ad_password: password } = adConf();
  return Boolean(url && password);
}

function fetchGroupMembers(group) {
  if (!isConfigured()) {
    return Promise.reject(new Error('AD-uppslag är inte konfigurerat (ad_url och ad_password i conf.auth)'));
  }
  const auth = adConf();
  const ad = new ActiveDirectory({
    url: auth.ad_url,
    baseDN: auth.ad_base_dn,
    username: auth.ad_username,
    password: auth.ad_password,
    tlsOptions: getTlsOptions(),
    attributes: {
      user: ['sAMAccountName', 'displayName', 'givenName', 'sn', 'mail', 'userAccountControl'],
    },
  });

  return new Promise((resolve, reject) => {
    // getUsersForGroup includes members of nested groups
    ad.getUsersForGroup(group, (err, users) => {
      if (err) return reject(err);
      if (!users) return reject(new Error(`AD-gruppen ${group} hittades inte`));
      resolve(users);
    });
  });
}

function toMember(user) {
  const name = user.displayName || [user.givenName, user.sn].filter(Boolean).join(' ') || user.sAMAccountName;
  return { username: user.sAMAccountName, name, email: user.mail || null };
}

// Active members of the AD group: [{ username, name, email }], sorted by name.
async function getGroupMembers(group) {
  const cache = caches.get(group);
  if (cache && Date.now() - cache.at < cacheMs()) return cache.users;

  const users = (await fetchGroupMembers(group))
    .filter((user) => user.sAMAccountName && !(Number(user.userAccountControl) & ACCOUNTDISABLE))
    .map(toMember)
    .sort((a, b) => a.name.localeCompare(b.name, 'sv'));

  caches.set(group, { at: Date.now(), users });
  return users;
}

// The last fetched list for the group, even if it is old. null if AD has never answered.
function cachedGroupMembers(group) {
  return caches.get(group)?.users || null;
}

module.exports = {
  isConfigured,
  getGroupMembers,
  cachedGroupMembers,
};
