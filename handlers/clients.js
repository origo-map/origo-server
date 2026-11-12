const express = require('express');
const clientsRouter = express.Router();

var supportedClients = require('../conf/config').auth.clients;

// state är antingen "<klientnamn>" eller "<klientnamn>.<slumpvärde>". Med slumpvärde skickas
// hela state tillbaka till klienten så att den kan verifiera inloggningen (skydd mot CSRF).
var clients = function(req, res) {
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  const clientName = state.split('.')[0];

  const clientUrl = Object.prototype.hasOwnProperty.call(supportedClients, clientName) ? supportedClients[clientName] : undefined;
  if (clientUrl) {
    const url = new URL(clientUrl);
    ['code', 'error', 'error_description'].forEach((param) => {
      if (typeof req.query[param] === 'string') url.searchParams.set(param, req.query[param]);
    });
    if (state !== clientName) url.searchParams.set('state', state);
    res.redirect(url.toString());
  } else {
    res.status(404).json({error: "The client was not found"})
  }
}

clientsRouter.get('', clients)

module.exports = clientsRouter;
