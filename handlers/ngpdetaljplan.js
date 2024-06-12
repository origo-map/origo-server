var conf = require('../conf/config');
var ex = require('express');
const fetch = (...args) =>
	import('node-fetch').then(({default: fetch}) => fetch(...args));

const router = ex.Router();

let configOptions = {};
/**
 * LM:s access token
 */
let token;
/**
 * Timestamp when the token expires (minus a little margin)
 */
let tokenExpires;
/**
 * Keeps track of how many times request has been runned in case token gets invalid
 */
let runCounter = 0;

if (conf['ngpDetaljplan']) {
    configOptions = Object.assign({}, conf['ngpDetaljplan']);
 }

/**
 * Logs in against LM and fills the global variable "token" with a new token
 */
async function createToken() {
    const url = new URL('token', configOptions.url_base);
    const myHeaders = new Headers();
    
    url.searchParams.set('scope', configOptions.scope);
    url.searchParams.set('grant_type', configOptions.grant_type);
    myHeaders.append('Authorization', 'Basic ' + Buffer.from(configOptions.client_key + ':' + configOptions.client_secret).toString('base64'));
    const response = await fetch(url, { method:'POST', headers: myHeaders });
    if(!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const responsebody = await response.json();

    token = responsebody.access_token;
    // We get how many seconds it lasts. Not an exact time. Calculate when it expires and deduct a little margin
    // for processing. You should be able to look in the token itself as well, but this is easier
    tokenExpires = Date.now() + responsebody.expires_in *1000 - 10000;
  }

  /**
   * Revokes current token and resets global variable "token"
   */
  async function revokeToken() {
    const url = new URL('revoke', configOptions.url_base);
    const myHeaders = new Headers();
    
    url.searchParams.set('scope', configOptions.scope);
    url.searchParams.set('token', token);
    myHeaders.append('Authorization', 'Basic ' + Buffer.from(configOptions.client_key + ':' + configOptions.client_secret).toString('base64'));
    const response = await fetch(url, { method:'POST', headers: myHeaders });
    if(!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    token = null;   
  }
 
/**
 * Ensures there is a valid token. Called before making an API call
 */
  async function ensureToken() {
    if(token && Date.now()  > tokenExpires) {
        // Recall the old one just in case there would be time left for it
        await revokeToken();
    }
    if(!token) {
        await createToken();
    }
}
  
  /**
   * Lists all assets as attachments
   * @param {*} planid detailed plan designation to list assets for. On form 2281K-DP199 or xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxxxxx
   * @returns List of file info
   */
async function listAssets(planid, res) {
    await ensureToken();
    const url = new URL('distribution/geodatakatalog/sokning/v1/detaljplan/v2/search', configOptions.url_base);
    
    const regex = /\$(.+?)\$/g;
    const query = configOptions.query.replace(regex, planid);
    const postdata = {
        "query": JSON.parse(query)
    };
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    myHeaders.append('Authorization', `Bearer ${token}`);
  
    const response = await fetch(url, { method: 'POST', body: JSON.stringify(postdata), headers: myHeaders });
    const fileinfos = [];
    if (!response.ok) {
        // Retry once in case the token as been invalid f.e. when same consumer key been used to create token on another server
        if (response.status === 401 && runCounter === 0) {
            runCounter += 1;
            await createToken();
            await listAssets(planid, res);
        } else {
            runCounter = 0;
            throw new Error(`Error: ${response.status}`);
        }
    } else {
        runCounter = 0;
        const responsebody = await response.json();
        // There must be exactly one feature because we searched by id
        if(responsebody.features.length === 0) {
            console.log('There must be exactly one feature because we searched by id');
            throw new Error('The plan is missing');
        }
        for (const key in responsebody.features[0].assets) {
            if (Object.hasOwnProperty.call(responsebody.features[0].assets, key)) {
                const asset = responsebody.features[0].assets[key];
    
                // The plan file itself is also included, with that it should be uninteresting, so take everything else
                if (!asset.roles.includes('detaljplan')) {
                    // Create a response according to origo attachment spec (AGS + group)
                    // ID could be the asset serial number, so you have to look up href again when you want to retrieve, but
                    // I don't know if the order is guaranteed, and there will be an extra call.
                    const id = asset.href.split('/').pop();
                    const fileInfo = {
                        "id": id,
                        // TODO: not sure it's pdf but we don't know and no one cares until we actually download
                        "contentType": 'application/pdf',
                        "name": asset.title,
                        // Group is not part of AGS-spec
                        "group": 'planer'
                    };
    
                    fileinfos.push(fileInfo);
                }
            }
        }
    }

    if (fileinfos.length > 0) {
        res.json({ "attachmentInfos": fileinfos });        
    }
}


/**
 * If we download an asset and stream it back directly to the client, we avoid buffering.
 * @param {*} uuid uuid for current asset
 * @param {*} res the response object to stream the result to
 */
async function getDocument(uuid, res) {
    await ensureToken();
    // Hopefully it's always at this url, otherwise we'll have to do another search and check the assets href.
    const url = new URL(`distribution/geodatakatalog/nedladdning/v1/asset/${uuid}`, configOptions.url_base);
    const myHeaders = new Headers();
    myHeaders.append('Authorization', `Bearer ${token}`);
    const response = await fetch(url, { headers: myHeaders });
    if (!response.ok) {
        // Retry once in case the token as been invalid f.e. when same consumer key been used to create token on another server
        if (response.status === 401 && runCounter === 0) {
            runCounter += 1;
            await createToken();
            await getDocument(uuid, res);
        } else {
            runCounter = 0;
            throw new Error(`Error: ${response.status}`);
        }
    } else {
        runCounter = 0;
        response.body.pipe(res);
    }
}


  
/**
 * Express handler that handles list attachments. Sends back attachments according to origo's spec
 * @param {*} req 
 * @param {*} res 
 */
const listAll = async (req, res) => {
    const id = req.params.filenumber;
    await listAssets(id, res);
}

/**
 * Express handler that streams a file to the client
 * @param {*} req 
 * @param {*} res 
 */
const fetchDoc = async (req, res) => {
    const documentid = req.params.uuid;
 
    if (typeof documentid !== 'undefined') {
        const checkUuidRegEx = /[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/i;
        let found = documentid.match(checkUuidRegEx);
        if (found !== null) {  
            const doc = await getDocument(documentid, res);
        } else {
            throw new Error(`Not valid documentid: ${documentid}`);
        }
    } else {
        throw new Error('No documentid found!');
    }
}

module.exports = { listAll, fetchDoc };