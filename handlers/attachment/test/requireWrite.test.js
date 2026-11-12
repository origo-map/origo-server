// Optional login for attachments: off by default, the Origin check and the user from the session.
// The AD check is replaced, so the test needs neither a login service nor AD.
//   npm run test:attachment
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const configFile = require.resolve(path.resolve(__dirname, '../../../conf/config'));
require.cache[configFile] = { id: configFile, filename: configFile, loaded: true, exports: { session: {} } };

const createRequireWrite = require('../requireWrite');

// Lets through whoever has a session with userinfo.sub in the "group".
let options;
const fakeRequireAdGroupMember = (opts) => {
  options = opts;
  return async (req, res, next) => {
    const userinfo = await opts.getUserinfo(req);
    if (!userinfo) return res.status(401).json({ error: 'Inloggning krävs' });
    if (userinfo.sub !== 'anna') return res.status(403).json({ error: opts.forbidden });
    return next();
  };
};

async function run(middleware, { origin, host = 'karta.sundsvall.se', forwardedHost, user } = {}) {
  const headers = { origin, host, 'x-forwarded-host': forwardedHost };
  const req = { get: (name) => headers[name.toLowerCase()], session: user ? { userinfo: { sub: user } } : {} };
  const result = {};
  const res = {
    set() { return res; },
    status(code) { result.status = code; return res; },
    json(body) { result.body = body; return res; },
  };
  await middleware(req, res, () => { result.status = 'next'; });
  return result;
}

const quiet = (fn) => async () => {
  const { warn, error } = console;
  console.warn = () => {};
  console.error = () => {};
  try { await fn(); } finally { console.warn = warn; console.error = error; }
};

test('without require_login everything goes through, as before', async () => {
  const mw = createRequireWrite({}, { requireAdGroupMember: fakeRequireAdGroupMember });
  assert.equal((await run(mw)).status, 'next');
  assert.equal((await run(mw, { origin: 'https://evil.example' })).status, 'next');
});

test('with require_login the user comes from the session and must be in the group', quiet(async () => {
  const mw = createRequireWrite({ require_login: true, ad_group: 'Redigerare' }, { requireAdGroupMember: fakeRequireAdGroupMember });
  assert.equal(options.adGroup, 'Redigerare');
  const origin = 'https://karta.sundsvall.se';
  assert.equal((await run(mw, { origin, user: 'anna' })).status, 'next');
  assert.equal((await run(mw, { origin, user: 'bo' })).status, 403);
  assert.equal((await run(mw, { origin })).status, 401);
}));

test('a request from another site, or without Origin, is refused even when logged in', quiet(async () => {
  const mw = createRequireWrite({ require_login: true }, { requireAdGroupMember: fakeRequireAdGroupMember });
  const res = await run(mw, { origin: 'https://evil.example', user: 'anna' });
  assert.equal(res.status, 403);
  assert.equal(res.body.error, 'Anropet kommer från en otillåten adress');
  assert.equal((await run(mw, { user: 'anna' })).status, 403);
  assert.equal((await run(mw, { origin: 'null', user: 'anna' })).status, 403);
}));

test('behind a proxy X-Forwarded-Host is the server address', quiet(async () => {
  const mw = createRequireWrite({ require_login: true }, { requireAdGroupMember: fakeRequireAdGroupMember });
  const res = await run(mw, {
    origin: 'https://karta.sundsvall.se', host: 'origoserver:3001', forwardedHost: 'karta.sundsvall.se', user: 'anna',
  });
  assert.equal(res.status, 'next');
}));

test('allowed_origins replaces the same-address rule', quiet(async () => {
  const mw = createRequireWrite({ require_login: true, allowed_origins: ['https://intern.sundsvall.se/'] }, { requireAdGroupMember: fakeRequireAdGroupMember });
  assert.equal((await run(mw, { origin: 'https://intern.sundsvall.se', user: 'anna' })).status, 'next');
  assert.equal((await run(mw, { origin: 'https://karta.sundsvall.se', user: 'anna' })).status, 403);
}));
