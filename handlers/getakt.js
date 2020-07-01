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
proxy.on('proxyReq', (proxyReq, req, res) => {

  // Get the request path
  const parsedUrl = url.parse(req.url);
  const query = parsedUrl.search;
  const path = parsedUrl.pathname;
  const targetPath = '/distribution/produkter/aktdirekt/v3.0';
  const conditions = ['Å', 'Ä', 'Ö'];
  let proxyPath;
  let index;

  // Set proper proxy request paths
  if (path.includes('index.djvu')) {
    // Edge Chromium does not have option to choose encoding as IE so in order to use IE inside Edge for opening DjVu documents,
    // we exclude encoding part and that due to swedish letters in some document querys.
    if (conditions.some(el => query.includes(el))) {
      index = `${targetPath}${path}${encodeURI(query)}`;
    } else {
      index = `${targetPath}${path}${query}`;
    }
    proxyPath = index;
  } else if (path.includes('page_')) {
    const page = `${targetPath}${path}`;
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
