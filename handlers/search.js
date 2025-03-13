var dbConfig = require('../conf/dbconfig');
var dbConnectors = require('../lib/dbconnectors');
var searchModel = require('../conf/dbconfig').models.search;
var dbType = require('../lib/dbtype');
var sendResponse = require('../lib/sendresponse');
var model = require('../models/dbmodels');

var search = function(req, res) {
  var query = req.query.q;
  var connectors = dbConfig.connectors.search;
  var multiSearchModels = Object.values(searchModel);
  
  var finishedModels = 0;
  var mergedResult = [];
  multiSearchModels.forEach((multiSearchModel) => {
    var db = multiSearchModel.connector || dbType(connectors) || 'pg';
    var queries = [];
    var tables = req.query.layers || multiSearchModel.tables;
    tables.forEach((table) => {
      var options = Object.assign({}, connectors[db], multiSearchModel, table);
      options.limit = options.limit || dbConfig.limit;
      if (req.query.limit && req.query.c !== 'true') {
        options.limit = options.limit ? Math.min(options.limit, req.query.limit) : req.query.limit;
      } else {
        options.limit = options.limit || 100;
      }
      var searchString = model[db](query, options);
      queries.push({
        queryString: searchString
      });
    });

    var connector = Object.assign({}, connectors[db], multiSearchModel);
    dbConnectors[db](res, queries, connector)
      .then((result) => {
        mergedResult.push.apply(mergedResult, result);
        finishedModels += 1;
        if(finishedModels == multiSearchModels.length) {
          sendResponse(res, JSON.stringify(mergedResult));
        }
      });
  });
}

module.exports = search;
