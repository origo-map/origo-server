const express = require('express');
const clientsRouter = express.Router();

var supportedClients = require('../conf/config').auth.clients;

var clients = function(req, res) {
  const clientName = req.query.state ?? '';

  let leClientUrl = supportedClients[clientName];
  if (leClientUrl) {
    leClientUrl = `${leClientUrl}?code=${req.query.code}`;
    res.redirect(leClientUrl);
  } else {
    res.status(404).json({error: "The client was not found"})
  }
}

clientsRouter.get('', clients)

module.exports = clientsRouter;
