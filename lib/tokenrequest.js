/**
 * Handler for getting an authentication token for Lantmäteriets services
 * Usage: 
 * Get consumer_key, consumer_secret and alternate set the scope at 
 * Lantmäteriets API-portal. Set them values in config.js.
 * 
 */

// Dependencies
const request = require('request');

// Export the module, invoke promise where service is requested.
module.exports = function getToken(url_token, key, secret, scope) {
    // Request options
    const options = {
        url: url_token,
        method: 'POST',
        auth: {
            user: key,
            pass: secret
        },
        form: {
            'scope': scope,
            'grant_type': 'client_credentials'
        }
    }
    // Return promise to be invoked for authenticating on service requests
    return new Promise((resolve, reject) => {
        // Requesting the token service object
        request(options, (error, response, body) => {
            if (error) {
                reject('An error occured collecting token: ', error);
            } else {
                resolve(body);
            }
        })
    })
}
