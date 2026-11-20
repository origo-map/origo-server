const axios = require('axios').default;
const conf = require('../conf/config');
const lmtokenhandler = require('../handlers/lmtokenhandler');

function handleError(err) {
  console.log(err);
}

const makeRequest = async function makeRequest(opt) {
  return new Promise((resolve, reject) => {
    axios({
      url: opt.url,
      method: opt.method,
      headers: opt.headers,
      data: opt.data
    })
      .then(response => {
        resolve(response.data);
      }).catch(err => {
        console.log(err);
        reject('Promise is rejected');
      })
  })
}

const lmservices = async function lmservices(params = {}) {
  const {
    typ,
    fastighet,
    id = [],
    includeData = 'total'
  } = params;
  let returnObj = {};
  // Parameter checking
  const checkUuidRegEx = /[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/i;
  let foundUuid = fastighet.match(checkUuidRegEx);
  if (foundUuid === null) {
    return { error: 'Error: fastighet parameter not valid' }
  }
  const checkIncludeDataRegEx = /^[A-Za-z]+$/i;
  let foundIncludeData = includeData.match(checkIncludeDataRegEx);
  if (foundIncludeData === null) {
    return { error: 'Error: includeData parameter not valid' }
  }

  if (conf && conf.lmservices && conf.lmservices.services && conf.lmservices.services[typ]) {
    const serviceConf = conf.lmservices.services[typ];
    if (conf.lmservices.apps && conf.lmservices.apps[serviceConf.app]) {
      const appConf = conf.lmservices.apps[serviceConf.app];
      const tokenObject = await lmtokenhandler(appConf);
      if (tokenObject) {
        if (typ === 'belagenhetsadress') {
          if (fastighet) {
            const response = await makeRequest({
              url: `${serviceConf.url}/registerenhet/${fastighet}?includeData=${includeData}`,
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${tokenObject.token}`
              }
            }).catch(handleError);
            returnObj.belagenhetsadress = response;
          }
        }
        if (typ === 'byggnad') {
          let ids = id;
          if (fastighet) {
            ids = await makeRequest({
              url: `${serviceConf.url}/referens/beror/${fastighet}`,
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${tokenObject.token}`
              }
            }).catch(handleError);
          }
          if (ids && ids.length > 0) {
            const response = await makeRequest({
              url: `${serviceConf.url}/?includeData=${includeData}`,
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${tokenObject.token}`
              },
              data: ids
            }).catch(handleError);
            returnObj.byggnad = response;
          }
        }
        if (typ === 'fastighetsamfallighet') {
          if (fastighet) {
            const response = await makeRequest({
              url: `${serviceConf.url}/${fastighet}?includeData=${includeData}`,
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${tokenObject.token}`
              }
            }).catch(handleError);
            returnObj.fastighetsamfallighet = response;
          }
        }
        if (typ === 'gemensamhetsanlaggning') {
          let ids = id;
          if (fastighet) {
            const refs = await makeRequest({
              url: `${serviceConf.url}/referens/delagande/${fastighet}`,
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${tokenObject.token}`
              }
            }).catch(handleError);
            if (refs) {
              ids = refs.map((ref) => ref.objektidentitet)
            }
          }
          if (ids && ids.length > 0) {
            const response = await makeRequest({
              url: `${serviceConf.url}/?includeData=${includeData}`,
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${tokenObject.token}`
              },
              data: ids
            }).catch(handleError);
            if (response.features?.length > 0) {
              for (const ga of response.features) {
                const response2 = await lmservices({ typ: 'rattighet', fastighet: ga.id });
                if (response2.rattighet?.features?.length > 0) {
                  ga.rattighet = response2.rattighet;
                }
              }
            }
            returnObj.gemensamhetsanlaggning = response;
          }
        }
        if (typ === 'inskrivning') {
          if (fastighet) {
            const response = await makeRequest({
              url: `${serviceConf.url}/beror/${fastighet}?includeData=${includeData}`,
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${tokenObject.token}`
              }
            }).catch(handleError);
            returnObj.inskrivning = response;
          }
        }
        if (typ === 'markreglerandebestammelse') {
          let ids = id;
          if (fastighet) {
            const refs = await makeRequest({
              url: `${serviceConf.url}/referens/beror/${fastighet}`,
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${tokenObject.token}`
              }
            }).catch(handleError);
            if (refs) {
              ids = refs.map((ref) => ref.objektidentitet)
            }
          }
          if (ids && ids.length > 0) {
            const response = await makeRequest({
              url: `${serviceConf.url}/?includeData=${includeData}`,
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${tokenObject.token}`
              },
              data: ids
            }).catch(handleError);
            returnObj.markreglerandebestammelse = response;
          }
        }
        if (typ === 'rattighet') {
          let ids;
          if (id) {
            ids = { "id": id }
          }
          if (fastighet) {
            const refs = await makeRequest({
              url: `${serviceConf.url}/referens/beror/${fastighet}`,
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${tokenObject.token}`
              }
            }).catch(handleError);
            if (refs) {
              ids = {
                "id": refs.map((ref) => ref.objektidentitet)
              }
            }
          }
          if (ids && ids.id && ids.id.length > 0) {
            const response = await makeRequest({
              url: `${serviceConf.url}/?includeData=${includeData}`,
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${tokenObject.token}`
              },
              data: ids
            }).catch(handleError);
            returnObj.rattighet = response;
          }
        }
        if (typ === 'taxering') {
          let ids;
          if (id && id.length > 0) {
            ids = {
              "taxeringsenhetsnummer": id
            }
          }
          if (fastighet) {
            const refs = await makeRequest({
              url: `${serviceConf.url}/referens/beror/${fastighet}`,
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${tokenObject.token}`
              }
            }).catch(handleError);
            if (refs) {
              ids = {
                "taxeringsenhetsnummer": refs.taxeringsenhetsreferens.map((ref) => ref.taxeringsenhetsnummer)
              }
            }
          }
          if (ids && ids.taxeringsenhetsnummer && ids.taxeringsenhetsnummer.length > 0) {
            const response = await makeRequest({
              url: `${serviceConf.url}/?includeData=${includeData}`,
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${tokenObject.token}`
              },
              data: ids
            }).catch(handleError);
            returnObj.taxering = response;
          }
        }
      } else { returnObj = { error: 'No token' } }
    } else { returnObj = { error: 'Error in configuration' } }
  } else { returnObj = { error: 'Error in configuration. Typ missing' } }
  return returnObj;
}
module.exports = lmservices;

