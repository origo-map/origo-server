/**
 * Module for requesting documents via AktDirekt, Lantmäteriet
 * Usage: 
 * Check for service health, response "UP" or "DOWN" - /origoserver/healthcheck
 * Get a djvu index page that gets all pages included in akt(document) - /origoserver/document/index.djvu?archive={archive/county-number}&id={akt-number}
 * Get a single djvu page - /origoserver/document/page_{vers}_{subdoc}_{page}_{archive}_{id}.djvu
 * 
 */

// Dependencies
const url = require('url');
const http = require('http');
const httpProxy = require('http-proxy');
const config = require('../conf/config');
const getToken = require('../lib/tokenrequest');

// Use the config for AktDirekt
const akturl = config.getAkt.url;
const aktkey = config.getAkt.consumer_key;
const aktsecret = config.getAkt.consumer_secret;
const aktscope = config.getAkt.scope;

// Token holder
let token;

// Proxy server holder
let proxy = httpProxy.createProxyServer();

// Get hold of that nested token and use in proxy request header
function tokenHeader() {
  return;
}

// Proxy request config
proxy.on('proxyReq', (proxyReq, req) => {

  // Get the request path
  const parsedUrl = url.parse(req.url);
  const query = parsedUrl.search;
  const path = parsedUrl.pathname;
  const pathPart = path.split("_");

  const pathObj = {
    page_: pathPart[0],
    vers: pathPart[1],
    subdoc: pathPart[2],
    page: pathPart[3],
    archive: pathPart[4],
    enc_id: pathPart[5]
  }

  // Proxy target option, akturl, exclude path so we define here and use it with proxyPath
  const targetPath = `/distribution/produkter/aktdirekt/v3.0`;
  // Proxy path holder
  let proxyPath;

  if (path.includes('healthcheck')) {
    const healthcheck = `${targetPath}${path}`;
    proxyPath = healthcheck;
  } else if (path.includes('index.djvu')) {
    const index = `${targetPath}${path}${encodeURI(query)}`;
    proxyPath = index;
  } else if (path.includes('page_')) {
    const page = `${targetPath}${pathObj.page_}_${pathObj.vers}_${pathObj.subdoc}_${pathObj.page}_${pathObj.archive}_${encodeURIComponent(pathObj.enc_id)}`;
    proxyPath = page;
  }

  // Set proper proxy request path
  proxyReq.path = proxyPath;
  // Set the proxy request headers
  proxyReq.setHeader(`Authorization`, `Bearer ${token}` + ` scope`, `${aktscope}`);
})

// If the http-proxy throws an error, log it
proxy.on('error', (err) => {
  console.log('AktDirekt proxy error: ', err);
})

// Do the request in proper order
const getAkt = async (req, res) => {
  // Call the promised token
  await getToken(aktkey, aktsecret, aktscope)
    .then(JSON.parse)
    .then((result) => {
      token = result.access_token;
      tokenHeader(token);
    })
    .catch((e) => {
      console.log(e);
    })
  // Send the request
  await proxy.web(req, res, {
    target: akturl,
    secure: false,
  })
}

// Export the module
module.exports = getAkt;
