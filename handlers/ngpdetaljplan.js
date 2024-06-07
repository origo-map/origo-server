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
 * Timestamp när tokenet expirar (minus lite marginal)
 */
let tokenExpires;

if (conf['ngpDetaljplan']) {
    configOptions = Object.assign({}, conf['ngpDetaljplan']);
 }

/**
 * Loggar in mot LM och fyller i globala variabeln "token" med ett nytt token
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
    // Vi får hur många sekunder den gäller. Inte ett exakt klockslag. Räkna ut när den expirar och dra av lite marginal
    // för processing. Man borde kunna kika i själva tokenet också, men detta är enklare
    tokenExpires = Date.now() + responsebody.expires_in *1000 - 10000;
  }

  /**
   * Återkallar aktuellt token och nollar globala variabeln "token"
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
 * Säkerställer att det finns ett giltigt token. Anropas innan man gör ett apianrop
 */
  async function ensureToken() {
    if(token && Date.now()  > tokenExpires) {
        // Återkalla det gamla bara utifall att det skulle vara tid kvar på det
        await revokeToken();
    }
    if(!token) {
        await createToken();
    }

  }
  
  /**
   * Listar alla assets som attachments
   * @param {*} planid detaljplansbeteckning att lista assets för. På formen 2281K-DP199
   * @returns Lista av fileinfo
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
        throw new Error(`Error: ${response.status}`);
    } else {
        const responsebody = await response.json();
        // Det skall finnas exakt en feature eftersom vi sökte på id
        if(responsebody.features.length === 0) {
            console.log('Det skall finnas exakt en feature eftersom vi sökte på id');
            throw new Error('Planen saknas');
        }
        for (const key in responsebody.features[0].assets) {
            if (Object.hasOwnProperty.call(responsebody.features[0].assets, key)) {
                const asset = responsebody.features[0].assets[key];
    
                // Själva planfilen kommer också med, med den torde vara ointressant, så ta allt annat
                if (!asset.roles.includes('detaljplan')) {
                    // Create a response according to origo attachment spec (AGS + group)
                    // ID skulle kunna vara assetlöpnumret, så får man slå upp href igen när man skall hämta, men 
                    // jag vet inte om ordningen är garanterad, och det blir ett extra anrop.
                    const id = asset.href.split('/').pop();
                    const fileInfo = {
                        "id": id,
                        // TODO: det är inte säkert att det är pdf, men vi vet inte och ingen bryr sig förrän vi faktiskt laddar ner
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

    return fileinfos;
}


/**
 * Hämtar en asset och streamar tillbaka den direkt till klienten så slipper vi buffra.
 * @param {*} uuid uiid för aktuell asset
 * @param {*} res response-objektet att streama resultatet till
 */
async function getDocument(uuid, res) {
    await ensureToken();
    // Förhoppningsvis är det alltid på denna url, annars måste vi göra en ny sökning och kolla assets href.
    const url = new URL(`distribution/geodatakatalog/nedladdning/v1/asset/${uuid}`, configOptions.url_base);
    const myHeaders = new Headers();
    myHeaders.append('Authorization', `Bearer ${token}`);
    const response = await fetch(url, { headers: myHeaders });
    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    } else {
        response.body.pipe(res);
    }
}


  
/**
 * Express handler som hanterar lista attachments. Skickar tillbaka attachments enligt origos spec
 * @param {*} req 
 * @param {*} res 
 */
const listAll = async (req, res) => {
    const id = req.params.filenumber;
    const list = await listAssets(id, res);
    if (list.length > 0) {
        res.json({ "attachmentInfos": list });        
    } else {
        res.json({});
    }
}

/**
 * Express handler som streamar en fil till klienten
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