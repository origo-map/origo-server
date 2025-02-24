var conf = require('../conf/config');
var axios = require('axios');
const { URL } = require('url'); 
const lmtokenhandler = require('./lmtokenhandler');

var confObj = 'lmcommunityassociation';
const uuidRegEx = /[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/i;

/**
 * Takes a list of samfällighetsföreningar and looks up the geometries for them and returns with a GeoJSON with geometry and properties added for the associations.
 * 
 * @async
 * @function
 * @name addGeometryAndMakeGeojson
 * @kind function
 * @param {any} arrSamfallPromises
 * @param {any} configOptions
 * @param {any} token
 * @returns {Object}
 */
async function addGeometryAndMakeGeojson(arrSamfallPromises, configOptions, token, srid) {
    const arrPromises = [];
    const arrFeatures = [];
    const objGemensamhetsanlaggning = {};
    const objSamfallighet = {};
    let resultGeojson = {};
    await Promise.all(arrSamfallPromises).then((samfallResults) => {
        samfallResults.forEach(function(reqPost) {
            if (reqPost.data) {
                if (reqPost.data.features.length > 0) {
                    reqPost.data.features.forEach(function(feature) {
                        if (feature.properties.forvaltningsobjekt) {
                            feature.properties.forvaltningsobjekt.forEach(function(forvaltningsobjekt) {
                                // For each maintained object of type gemensamhetsanläggning get the geometry from Gemensamhetsanläggning Direkt 
                                // and collect the properties which should be included
                                if (forvaltningsobjekt.gemensamhetsanlaggning) {
                                    objGemensamhetsanlaggning[forvaltningsobjekt.gemensamhetsanlaggning.objektidentitet] = {
                                        "foreningensForetagsnamn": feature.properties.samfallighetsforeningsattribut.foreningensForetagsnamn,
                                        "foreningstyp": feature.properties.samfallighetsforeningsattribut.foreningstyp,
                                        "status": feature.properties.samfallighetsforeningsattribut.status,
                                        "organisationsnummer": feature.properties.samfallighetsforeningsattribut.organisationsnummer,
                                        "statsbidragsnummer": feature.properties.samfallighetsforeningsattribut.statsbidragsnummer,
                                        "samfallighetsforening_objektidentitet": feature.properties.objektidentitet,
                                        "gemensamhetsanlaggning_objektidentitet": forvaltningsobjekt.gemensamhetsanlaggning.objektidentitet,
                                        "gemensamhetsanlaggning_beteckning": forvaltningsobjekt.gemensamhetsanlaggning.beteckning
                                    };
                                    arrPromises.push(axios({
                                        method: 'GET',
                                        url: encodeURI(configOptions.url_ga + '/' + forvaltningsobjekt.gemensamhetsanlaggning.objektidentitet + '?includeData=geometri&srid=' + srid),
                                        headers: {
                                        'Authorization': 'Bearer ' + token,
                                        'content-type': 'application/json',
                                        'scope': `${configOptions.scope}`
                                        }
                                    }));
                                }
                                // For each maintained object of type samfällighet get the geometry from Fastighet och samfällighet Direkt
                                // and collect the properties which should be included
                                if (forvaltningsobjekt.samfallighet) {
                                    objSamfallighet[forvaltningsobjekt.samfallighet.objektidentitet] = {
                                        "foreningensForetagsnamn": feature.properties.samfallighetsforeningsattribut.foreningensForetagsnamn,
                                        "foreningstyp": feature.properties.samfallighetsforeningsattribut.foreningstyp,
                                        "status": feature.properties.samfallighetsforeningsattribut.status,
                                        "organisationsnummer": feature.properties.samfallighetsforeningsattribut.organisationsnummer,
                                        "statsbidragsnummer": feature.properties.samfallighetsforeningsattribut.statsbidragsnummer,
                                        "samfallighetsforening_objektidentitet": feature.properties.objektidentitet,
                                        "registerenhetsomrade_objektidentitet": forvaltningsobjekt.samfallighet.objektidentitet
                                    };
                                    arrPromises.push(axios({
                                        method: 'GET',
                                        url: encodeURI(configOptions.url_fs + '/' + forvaltningsobjekt.samfallighet.objektidentitet + '?includeData=omrade&srid=' + srid),
                                        headers: {
                                        'Authorization': 'Bearer ' + token,
                                        'content-type': 'application/json',
                                        'scope': `${configOptions.scope}`
                                        }
                                    }));
                                }
                            });
                        }
                    });
                }
            } else {
                res.render('lmCommunityAssociationListError', { error: 'No forvaltningsobjekt!' });
            }
        });
    });
    await Promise.all(arrPromises).then((geomRresults) => {
        geomRresults.forEach(function(geomResult) {
            if (geomResult.data.features.length > 0) {
                geomResult.data.features.forEach(function(feature) {
                    let pushFeature = true;
                    if (feature.geometry === null) {
                        // If no geometry in response then it's a samfällighet, so get the geometry from registerenhetsomrade
                        const arrCoords = [];
                        if (typeof feature.properties.registerenhetsomrade !== 'undefined') {
                            feature.properties.registerenhetsomrade.forEach(function(registerenhetsomrade) {
                                if (typeof registerenhetsomrade.yta !== 'undefined') {
                                    registerenhetsomrade.yta.forEach(function(coords) {
                                        arrCoords.push(coords); 
                                    });
                                } else {
                                    arrCoords.push(registerenhetsomrade.centralpunktskoordinat); 
                                }
                            });
                        }
                        arrFeatures.push({
                            "type": "Feature",
                            "crs": {
                            "type": "name",
                            "properties": {
                                "name": "urn:ogc:def:crs:EPSG::" + srid
                            }
                            },
                            "geometry": {
                                "type": "GeometryCollection",
                                "geometries": arrCoords
                            },
                            "properties": objSamfallighet[feature.properties.objektidentitet]
                        }); 
                    } else {
                        // Add the feature from previous calls to an array but first check if this association already is added and in that case append this geometry to the association.
                        const tmpFeat = feature;
                        arrFeatures.forEach(function(featGA, index) {
                            if (typeof featGA.properties !== 'undefined') {
                                if (featGA.properties.samfallighetsforening_objektidentitet === objGemensamhetsanlaggning[feature.properties.objektidentitet].samfallighetsforening_objektidentitet) {
                                    arrFeatures[index].geometry.geometries.push(feature.geometry.geometries[0]);
                                    pushFeature = false;
                                }
                            }
                        }); 
                        if (pushFeature) {
                            tmpFeat.properties = objGemensamhetsanlaggning[feature.properties.objektidentitet];
                            arrFeatures.push(tmpFeat); 
                        }
                    }                                                        
                });
            }
        });
    }).finally(() => {
        resultGeojson = {
            "type": "FeatureCollection",
            "crs": {
                "type": "name",
                "properties": {
                    "name": "urn:ogc:def:crs:EPSG::" + srid
                }
            },
            "features": arrFeatures };
    });
    return resultGeojson;
}

/**
 * Main function to process requests.
 * Handles token retrieval and directing request handling based on method (GET/POST).
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
const lmCommunityAssociation = async (req, res) => {
    if (conf[confObj]) {
      const config = Object.assign({}, conf[confObj]);
      try {
        // Retrieve access token from Lantmäteriet using the helper module for token handling
        const tokenObject = await lmtokenhandler({
          id: confObj,
          url_token: config.url_token,
          url_revoke: config.url_revoke,
          consumer_key: config.consumer_key,
          consumer_secret: config.consumer_secret,
          scope: config.scope
        });
        // Process GET or POST requests for elevation data
        await doProcessRequests(req, res, config, tokenObject.token);
      } catch (error) {
        console.log('Error:', error);
        res.status(500).send({ 'error': error.message });
      }
  
    }
}
  
/**
 * Handles data requests to community association API.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {Object} configOptions - Configuration options for the API.
 * @param {string} token - Authorization token for the API.
 */
async function doProcessRequests(req, res, configOptions, token) {
    var urlArr;
    var urlStr = req.url;
  
    // Remove the query string from the URL
    if(urlStr.indexOf('?') !== -1) {
        urlStr = urlStr.slice(0, urlStr.indexOf('?'));
    }
    // Split the remaining URL into parts
    urlArr = urlStr.split('/');

    switch (urlArr[3]) {
        case 'beror':
            const uuid = urlArr[4];
            let found = uuid.match(uuidRegEx);
            // Check to see if the uuid are a valid UUID and only proceed if it is
            if (found !== null) {
                Promise.all([axios({
                    method: 'GET',
                    url: encodeURI(configOptions.url + '/referens/beror/' + uuid),
                    headers: {
                    'Authorization': 'Bearer ' + token,
                    'content-type': 'application/json',
                    'scope': `${configOptions.scope}`
                    }
                })]).then(([req1]) => {
                    const associationIdArr = [];
                    if (req1.data.length > 0) {
                        req1.data.forEach(element => {
                            //responseArray.push({ address: element.adress, objectidentifier: element.objektidentitet });
                            associationIdArr.push(element.objektidentitet);
                        });
                        associationIdArr.forEach(uuid => {
                            Promise.all([axios({
                                method: 'GET',
                                url: encodeURI(configOptions.url + '/' + uuid + '?includeData=total'),
                                headers: {
                                'Authorization': 'Bearer ' + token,
                                'content-type': 'application/json',
                                'scope': `${configOptions.scope}`
                                }
                            })]).then(([req2]) => {
                                if (req2.data.features.length > 0) {
                                    res.render('lmCommunityAssociation', req2.data);
                                }
                            });
                        });
                    } else {
                        res.render('lmCommunityAssociationError', { fid: uuid });
                    }
                });
            }
            break;
    
            case 'filter':
                // Get the query parameters from the url and check that only valid parameters are sent to the API
                let srid = '3006';
                const fullUrl = req.protocol + '://' + req.get('host') + req.url;
                const accessHeader = req.header('Accept');
                let geojson = false;
                if (typeof accessHeader !== 'undefined') {
                    if (accessHeader === 'application/geo+json' || accessHeader === 'application/geojson') {
                        geojson = true;
                    }
                }
                const parsedUrl = new URL(fullUrl);
                const params = new URLSearchParams();
                const parametersToCheck = [
                'lanskod', 'sate', 'sateMatch', 'kommunkodForvaltningsobjekt',
                'namn', 'namnMatch', 'foreningstyp', 'andamal', 'maxHits', 'srid'
                ];
                
                parametersToCheck.forEach(param => {
                if (parsedUrl.searchParams.has(param)) {
                    params.append(param, parsedUrl.searchParams.get(param));
                }
                });
                // If not maxHits is set specifically, set it to infinite otherwise it will default to 100 matches.
                if (!params.has('maxHits')) {
                    params.set('maxHits', 0);
                }
                // If srid is set specifically, use that otherwise continue using deafult 3006.
                if (params.has('srid')) {
                    srid = parsedUrl.searchParams.get('srid');
                }
                const newQueryString = params.toString();
                const response = await axios({
                    method: 'GET',
                    url: encodeURI(configOptions.url + '/referens/filter?' + newQueryString),
                    headers: {
                    'Authorization': 'Bearer ' + token,
                    'content-type': 'application/json',
                    'scope': `${configOptions.scope}`
                    }
                });
                const assArray = response.data;
                if (assArray.length > 0) {
                    if (geojson) {
                        // If the result should be sent back as a GeoJSON first do a POST and retrieve the objects that is maintain by the association.
                        const objektList = [];
                        assArray.forEach(function(parameter) {
                            if (parameter.objektidentitet) {
                                objektList.push(parameter.objektidentitet);
                            }
                        });
                        // The maximum number of object IDs per request
                        const MAX_OBJECTS_PER_REQUEST = 250;
                        const arrSamfallPromises = [];
                        // Since there is a limit of 250 object ids in a POST it has to be split in multiple parts.
                        // Loop through objektList in chunks of 250
                        for (let i = 0; i < objektList.length; i += MAX_OBJECTS_PER_REQUEST) {
                            // Take a slice of the list from the current index `i` for up to the next 250 elements
                            const chunk = objektList.slice(i, i + MAX_OBJECTS_PER_REQUEST);

                            // Create a promise for the current chunk and add it to the arrSamfallPromises array
                            const promise = axios({
                                method: 'POST',
                                url: encodeURI(configOptions.url + '/' + '?includeData=berorkrets,basinformation'),
                                headers: {
                                    'Authorization': 'Bearer ' + token,
                                    'Content-Type': 'application/json',
                                    'Scope': `${configOptions.scope}`
                                },
                                data: chunk,
                                json: true
                            });

                            arrSamfallPromises.push(promise);
                        }
                        const resultingGeojson = await addGeometryAndMakeGeojson(arrSamfallPromises, configOptions, token, srid);
                        res.send(resultingGeojson);
                    } else {
                        // Sorting the array by the 'foreningensForetagsnamn' key
                        assArray.sort((a, b) => {
                            if (a.foreningensForetagsnamn.toLowerCase() < b.foreningensForetagsnamn.toLowerCase()) {
                            return -1;
                            }
                            if (a.foreningensForetagsnamn.toLowerCase() > b.foreningensForetagsnamn.toLowerCase()) {
                            return 1;
                            }
                            return 0;
                        });
                        res.render('lmCommunityAssociationList', { associations: assArray, numberAssociations: assArray.length });
                    }
                } else {
                    res.render('lmCommunityAssociationListError', { error: 'No matches!' });
                }
                break;

            case 'ga_geometry':
                const ga_uuid = urlArr[4];
                let gaMatch = ga_uuid.match(uuidRegEx);
                // Check to see if the uuid are a valid UUID and only proceed if it is
                if (gaMatch !== null) {
                    Promise.all([axios({
                        method: 'GET',
                        url: encodeURI(configOptions.url_ga + '/' + ga_uuid + '?includeData=geometri'),
                        headers: {
                        'Authorization': 'Bearer ' + token,
                        'content-type': 'application/json',
                        'scope': `${configOptions.scope}`
                        }
                    })]).then(([reqGaGeo]) => {
                        if (reqGaGeo.data.features.length > 0) {
                            res.send(reqGaGeo.data);
                        } else {
                            res.render('lmCommunityAssociationListError', { error: 'No geometry!' });
                        }
                    });
                } else {
                    res.render('lmCommunityAssociationListError', { error: 'Not valid objektidentitet!' });
                }
                break;

        default:
            const assUuid = urlArr[3];
            let valid = assUuid.match(uuidRegEx);
            // Check to see if the uuid are a valid UUID and only proceed if it is
            if (valid !== null) {
                Promise.all([axios({
                    method: 'GET',
                    url: encodeURI(configOptions.url + '/' + assUuid + '?includeData=total'),
                    headers: {
                    'Authorization': 'Bearer ' + token,
                    'content-type': 'application/json',
                    'scope': `${configOptions.scope}`
                    }
                })]).then(([reqGet]) => {
                    if (reqGet.data) {
                        if (reqGet.data.features.length > 0) {
                            res.render('lmCommunityAssociation', reqGet.data);
                        }
                    } else {
                        res.render('lmCommunityAssociationListError', { error: 'No match!' });
                    }
                });
            } else {
                res.render('lmCommunityAssociationListError', { error: 'Not valid objektidentitet!' });
            }
            break;
    }
}

// Export the module
module.exports = lmCommunityAssociation;