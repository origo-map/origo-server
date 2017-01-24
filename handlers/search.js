var dbConfig = require('../conf/dbconfig');
var dbConnectors = require('../lib/dbconnectors');
var searchModel = require('../conf/dbconfig').models.search;
var dbType = require('../lib/dbtype');
var sendResponse = require('../lib/sendresponse');
var model = require('../models/dbmodels');

var search = function(req, res) {
  var query = req.query.q;
  var connector = dbConfig.connectors.search;
  var multiSearchModel = searchModel.search;
  var limit = dbConfig.limit || 100;
  var layers = req.query.layers || multiSearchModel.layers;

  var db = dbType(connector);
  var queries = [];
  layers.forEach(function(layer) {
    multiSearchModel.table = layer;
    var searchString = model[db](query, multiSearchModel, limit);
    queries.push({
      queryString: searchString
    });
  })


  dbConnectors[db](res, queries, connector[db])
    .then(function(result) {
      sendResponse(res, JSON.stringify(result));
    });
}


module.exports = search;
