var dbConfig = require('../conf/dbconfig');
var dbConnectors = require('../lib/dbconnectors');
var dbType = require('../lib/dbtype');
var sendResponse = require('../lib/sendresponse');
var model = require('../models/dbmodels');

var singleSearch = function(req, res) {
  var query = req.query.q;
  var connector = dbConfig['connectors']['singlesearch'];
  var searchModel = dbConfig['models']['singlesearch']['search'];
  var limit = dbConfig.limit || 100;

  var db = dbType(connector);
  var dbModel = model[db];
  var searchString = dbModel(query, searchModel, limit);

  var queries = [];

  queries.push({
    queryString: searchString
  });

  dbConnectors[db](res, queries, connector[db])
    .then(function(result) {
      sendResponse(res, JSON.stringify(result));
    });

}

module.exports = singleSearch;
