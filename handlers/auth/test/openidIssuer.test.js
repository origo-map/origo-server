// openidIssuer drops the cached client on network errors so that the next request does discovery
// again. Config and openid-client are replaced, so the test needs no login service.
//   npm run test:auth
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const handlers = path.resolve(__dirname, '../..');

function stub(file, exports) {
  const filename = require.resolve(file);
  require.cache[filename] = { id: filename, filename, loaded: true, exports };
}

let discoveries = 0;
stub(path.join(handlers, '../conf/config'), {
  auth: { openidIssuer: 'https://login.example/.well-known/openid-configuration', client_id: 'x' }
});
stub(require.resolve('openid-client', { paths: [handlers] }), {
  custom: { setHttpOptionsDefaults() {} },
  Issuer: {
    discover: async () => {
      discoveries += 1;
      return {
        issuer: 'https://login.example',
        token_endpoint: `https://login.example/token/${discoveries}`,
        userinfo_endpoint: 'https://login.example/userinfo',
        Client: class {}
      };
    }
  }
});

const openidIssuer = require('../openidIssuer');

const timeout = () => new Error('outgoing request timed out after 10000ms');
const socketError = () => Object.assign(new Error('connect'), { code: 'ECONNRESET' });
const loginServiceError = () =>
  Object.assign(new Error('invalid_grant'), { response: { statusCode: 400 } });

beforeEach(async () => {
  // Start every test with a cached client.
  openidIssuer.resetOnNetworkError(timeout(), 'token_endpoint');
  await openidIssuer.getOpenidClient();
});

test('network errors are recognised', () => {
  assert.equal(openidIssuer.isNetworkError(timeout()), true);
  assert.equal(openidIssuer.isNetworkError(socketError()), true);
  assert.equal(openidIssuer.isNetworkError(loginServiceError()), false);
  assert.equal(openidIssuer.isNetworkError(new Error('something else')), false);
});

test('the client is kept as long as nothing fails', async () => {
  const first = await openidIssuer.getOpenidClient();
  assert.equal(await openidIssuer.getOpenidClient(), first);
});

test('a timeout drops the client and the next call does discovery again', async () => {
  const first = await openidIssuer.getOpenidClient();
  const before = discoveries;
  assert.equal(openidIssuer.resetOnNetworkError(timeout(), 'token_endpoint'), true);
  const second = await openidIssuer.getOpenidClient();
  assert.notEqual(second, first);
  assert.equal(discoveries, before + 1);
});

test('an error from the login service keeps the client', async () => {
  const first = await openidIssuer.getOpenidClient();
  assert.equal(openidIssuer.resetOnNetworkError(loginServiceError(), 'token_endpoint'), false);
  assert.equal(await openidIssuer.getOpenidClient(), first);
});
