const express = require('express');
const { listAll, fetchDoc } = require('./detaljplan');
const ngpRouter = express.Router();

ngpRouter.get('/dpdocuments/:table/:filenumber/attachments/', listAll);
ngpRouter.get('/dpdocuments/:table/:filenumber/attachments/:uuid', fetchDoc);

module.exports = ngpRouter;
