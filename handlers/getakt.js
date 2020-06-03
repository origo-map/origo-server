/**
 * Module for requesting documents via AktDirekt, Lantmäteriet
 * Usage: 
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
const url_token = config.getAkt.url_token;
const consumer_key = config.getAkt.consumer_key;
const consumer_secret = config.getAkt.consumer_secret;
const scope = config.getAkt.scope;

// Token holder
let token;

// Activate the http-proxy server
proxy = httpProxy.createProxyServer();

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
  };

  // Proxy target option, akturl, exclude path so we define here and use it with proxyPath
  const targetPath = '/distribution/produkter/aktdirekt/v3.0';

  // Proxy path holder
  let proxyPath;

  // Set proper proxy request paths
  if (path.includes('index.djvu')) {
    const index = `${targetPath}${path}${encodeURI(query)}`;
    proxyPath = index;
  } else if (path.includes('page_')) {
    const page = `${targetPath}${pathObj.page_}_${pathObj.vers}_${pathObj.subdoc}_${pathObj.page}_${pathObj.archive}_${encodeURIComponent(pathObj.enc_id)}`;
    proxyPath = page;
  }
  proxyReq.path = proxyPath;

  // Set the proxy request headers
  proxyReq.setHeader('Authorization', `Bearer ${token}`, ' scope', `${scope}`);
});

// If the http-proxy throws an error, log it
proxy.on('error', (err) => {
  console.log('AktDirekt proxy: ', err);
});

// Do the request in proper order
const getAkt = async (req, res) => {

  // Call the promised token
  await getToken(url_token, consumer_key, consumer_secret, scope)
    .then(JSON.parse)
    .then((result) => {
      token = result.access_token;
    })
    .catch((err) => {
      console.log(err);
    });

  // Send the request
  await proxy.web(req, res, {
    target: 'https://api.lantmateriet.se',
    secure: false
  });
}

// Export the module
module.exports = getAkt;
