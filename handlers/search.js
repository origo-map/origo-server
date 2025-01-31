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
  var tables = req.query.layers || multiSearchModel.tables;

  var db = dbType(connector);
  var queries = [];
  tables.forEach(function(table) {
    var options = Object.assign({}, multiSearchModel, table);
    options.limit = options.limit || dbConfig.limit;
    if (req.query.limit) {
      options.limit = options.limit ? Math.min(options.limit, req.query.limit) : req.query.limit;
    } else {
      options.limit = options.limit || 100;
    }
    var searchString = model[db](query, options);
    queries.push({
      queryString: searchString
    });
  });


  dbConnectors[db](res, queries, connector[db])
    .then(function(result) {
      sendResponse(res, JSON.stringify(result));
    });
};


module.exports = search;
