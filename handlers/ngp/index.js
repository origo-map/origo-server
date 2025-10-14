const express = require('express');
const { listAll, fetchDoc, getCollectionItems, doSearch } = require('./detaljplan');
const ngpRouter = express.Router();

ngpRouter.get('/dpdocuments/:table/:filenumber/attachments/', listAll);
ngpRouter.get('/dpdocuments/:table/:filenumber/attachments/:uuid', fetchDoc);
ngpRouter.get('/dpcollection/:collectionId/items/', getCollectionItems);
ngpRouter.get('/dpsearch/:queryId/query', doSearch);

module.exports = ngpRouter;
