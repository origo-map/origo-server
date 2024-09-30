const axios = require('axios').default;

const tokens = {};

const revokeToken = async function revokeToken(proxyOptions) {
  if(!tokens[proxyOptions.id]){
    return;
  }
  return new Promise((resolve, reject) => {
    axios({
        url: proxyOptions.url_revoke,
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(proxyOptions.consumer_key + ':' + proxyOptions.consumer_secret).toString('base64')
        },
        params: {
          'token': tokens[proxyOptions.id].token
        }
      })
      .then(response => {
        delete tokens[proxyOptions.id];
        resolve();
      }).catch(err => {
        console.log(err);
        reject('Promise is rejected');
      })
  })
}

const createToken = async function createToken(proxyOptions) {
  return new Promise((resolve, reject) => {
    axios({
        url: proxyOptions.url_token,
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(proxyOptions.consumer_key + ':' + proxyOptions.consumer_secret).toString('base64')
        },
        params: {
          'scope': proxyOptions.scope || 'default',
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

const getToken = async function getToken(proxyOptions) {
	const options = proxyOptions;
	const id = options.id || 'default';
	let tokenObject = tokens[id];
	if(!tokenObject){
      tokenObject = await createToken(options);
      tokens[id] = tokenObject;
      return tokenObject;
	} else if (!tokenObject.tokenExpires || Math.floor(Date.now() / 1000) > tokenObject.tokenExpires) {
      if (tokenObject.tokenExpires && Math.floor(Date.now() / 1000) > tokenObject.tokenExpires) {
        await revokeToken(options);
      }
      tokenObject = await createToken(options);
      tokens[id] = tokenObject;
      return tokenObject;
    }
  return tokenObject;
}

module.exports = getToken;