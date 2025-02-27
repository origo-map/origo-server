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
  return new mssql.ConnectionPool(config).connect()
    .then((conn) => {
      connection = conn;

      // Query
      var promises = queries.map((query) => {
        return new mssql.Request(connection)
          .query(query.queryString).then((result) => {
            if (query.hasOwnProperty('cb')) {
              searchResult = searchResult.concat(query.cb(result.recordset));
            } else {
              searchResult = searchResult.concat(result.recordset);
            }
          }).catch((err) => {
            console.log(err);
            // ... error checks
          });
      });

      return Promise.all(promises).then(() => {
        return searchResult;
      });


    }).catch((err) => {
      console.log(err);
      // ... error checks
    });
}

module.exports = mssqlConnect;
