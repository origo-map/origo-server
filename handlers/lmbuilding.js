var conf = require('../conf/config');
var objectifier = require('../lib/utils/objectifier');
var axios = require('axios');
const lmtokenhandler = require('./lmtokenhandler');

var confObj = 'lmbuilding';
var linkToOwner = true;

/**
 * Handles the request to retrieve building information using the Lantmäteriet API.
 * @param {Object} req - The request object from Express.
 * @param {Object} res - The response object from Express.
 */
const lmBuilding = async (req, res) => {
  if (conf[confObj]) {
    const config = Object.assign({}, conf[confObj]);
    try {
      // Retrieve access token from Lantmäteriet
      const tokenObject = await lmtokenhandler({
        id: confObj,
        url_token: config.url_token,
        url_revoke: config.url_revoke,
        consumer_key: config.consumer_key,
        consumer_secret: config.consumer_secret,
        scope: config.scope
      });
      const searchUrl = req.url;
      // Handle search request based on type (registerenhet or byggnad)
      await handleSearchRequest(req, res, config, tokenObject.token, searchUrl.includes("registerenhet"));
    } catch (error) {
      console.error('Error:', error);
      res.render('lmbuildingerror', { error: 'An error occurred during processing.' });
    }
  } else {
    res.render('lmbuildingerror', { error: 'Configuration missing for proxy.' });
  }
}

/**
 * Handles the search request for building or property data.
 * @param {Object} req - The request object from Express.
 * @param {Object} res - The response object from Express.
 * @param {Object} config - The configuration object for the API.
 * @param {string} token - The access token for the API.
 * @param {boolean} isRegisterEnhet - Indicates if the request is for registerenhet.
 */
async function handleSearchRequest(req, res, config, token, isRegisterEnhet) {
  // Get the identifier based on the request type (registerenhet or byggnad)
  const id = isRegisterEnhet ? objectifier.get('query.registerenhet', req) || '' : objectifier.get('query.uuid', req) || '';
  const urlPath = isRegisterEnhet ? `/referens/beror/${id}?includeData=total` : '/?includeData=total';
  const method = isRegisterEnhet ? 'GET' : 'POST';
  const data = isRegisterEnhet ? null : [id];

  const options = {
    url: encodeURI(config.url + urlPath),
    method: method,
    headers: {
      'content-type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'scope': `${config.scope}`
    },
    data: data,
    json: true
  };
  try {
    // Make the request to the API
    const response = await axios(options);
    if (isRegisterEnhet) {
      if (response.data && response.data.length > 0) {
        // Get building information if data is returned
        await getBuildingInformation(req, res, config, token, response.data, id, isRegisterEnhet);
      } else {
        console.log('No buildings object!');
        res.render('lmbuildingerror', { error: 'No buildings object!' });
      }
    } else {
      registerEnhetId = response.data.features[0].properties.liggerPa.registerenhetsreferens.objektidentitet; // Get registerEnhetId from returned data

      await getBuildingInformation(req, res, config, token, [id], registerEnhetId, isRegisterEnhet);
    }
  } catch (error) {
    console.error('Error during search request:', error);
    res.render('lmbuildingerror', { error: 'An error occurred during processing.' });
  }
}
/**
 * Retrieves detailed building information from the API.
 * @param {Object} req - The request object from Express.
 * @param {Object} res - The response object from Express.
 * @param {Object} config - The configuration object for the API.
 * @param {string} token - The access token for the API.
 * @param {Array} objektList - The list of building object identifiers.
 * @param {string} fid - The identifier for the building or property.
 */
async function getBuildingInformation(req, res, config, token, objektList, fid, isRegisterEnhet) {
  const options = {
    method: 'POST',
    url: encodeURI(config.url + '/?includeData=total'),
    headers: {
      'content-type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'scope': `${config.scope}`
    },
    data: objektList,
    json: true
  };

  try {
    // Make the request to get building information
    const response = await axios(options);
    let feat = response.data.features;
    // Sort the features by building number
    feat.sort((a, b) => a.properties.byggnadsattribut.husnummer - b.properties.byggnadsattribut.husnummer);
    if (linkToOwner) {
      response.data.objektidentitet = fid;
    }
    if (isRegisterEnhet) {
      res.render('lmbuildingRegisterenhet', response.data);
    } else {
      res.render('lmbuildingSingleBuilding', response.data);
    }
  } catch (error) {
    console.error('ERROR getBuilding!', error);
    res.render('lmbuildingerror', { fid: fid });
  }
}

module.exports = lmBuilding;
