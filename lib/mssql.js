var Promise = require('bluebird');
var moduleExists = require('./utils/moduleexists');
var mssql;
if (moduleExists('mssql')) {
  mssql = require('mssql');
}

var mssqlConnect = function(res, queries, dbConfig) {

  var config = {
    user: dbConfig.user,
    password: dbConfig.password,
    server: dbConfig.connectString,
    database: dbConfig.database

  }
  var connection;
  var searchResult = [];
  return new mssql.Connection(config).connect()
    .then(function(conn) {
      connection = conn;

      // Query
      var promises = queries.map(function(query) {
        return new mssql.Request(connection)
          .query(query.queryString).then(function(result) {
            if (query.hasOwnProperty('cb')) {
              searchResult = searchResult.concat(query.cb(result));
            } else {
              searchResult = searchResult.concat(result);
            }
          }).catch(function(err) {
            console.log(err);
            // ... error checks
          });
      });

      return Promise.all(promises).then(function() {
        return searchResult;
      });


    }).catch(function(err) {
      console.log(err);
      // ... error checks
    });
}

module.exports = mssqlConnect;
