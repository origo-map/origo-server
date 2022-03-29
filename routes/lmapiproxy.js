const axios = require('axios').default;
const proxy = require('express-http-proxy');

const lmApiProxy = function(proxyOptions) {
  let tokenObject = {};
  return proxy(proxyOptions.url, {
    https: true,
    proxyReqOptDecorator: async (proxyReqOpts, srcReq) => {
      tokenObject = await getToken(proxyOptions, tokenObject);
      proxyReqOpts.headers['Authorization'] = `Bearer ${tokenObject.token}`;
      return proxyReqOpts;
    }
  })
}

async function revokeToken(proxyOptions, tokenObject) {
  return new Promise((resolve, reject) => {
    axios({
        url: proxyOptions.url_revoke,
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(proxyOptions.consumer_key + ':' + proxyOptions.consumer_secret).toString('base64')
        },
        params: {
          'scope': proxyOptions.scope,
          'token': tokenObject.token
        }
      })
      .then(response => {
        resolve();
      }).catch(err => {
        console.log(err);
        reject('Promise is rejected');
      })
  })
}

async function createToken(proxyOptions) {
  return new Promise((resolve, reject) => {
    axios({
        url: proxyOptions.url_token,
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(proxyOptions.consumer_key + ':' + proxyOptions.consumer_secret).toString('base64')
        },
        params: {
          'scope': proxyOptions.scope,
          'grant_type': 'client_credentials'
        }
      })
      .then(response => {
        resolve({
          token: response.data.access_token,
          tokenExpires: Math.floor(Date.now() / 1000) + response.data.expires_in - 10
        });
      }).catch(err => {
        console.log(err);
        reject('Promise is rejected');
      })
  })
}

async function getToken(proxyOptions, tokenObject) {
  if (!tokenObject.tokenExpires || Math.floor(Date.now() / 1000) > tokenObject.tokenExpires) {
    if (tokenObject.tokenExpires && Math.floor(Date.now() / 1000) > tokenObject.tokenExpires) {
      await revokeToken(proxyOptions, tokenObject)
    }
    const newTokenObject = await createToken(proxyOptions);
    return newTokenObject;
  }
  return tokenObject;
}

module.exports = lmApiProxy;