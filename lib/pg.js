var Promise = require('bluebird');
var moduleExists = require('./utils/moduleexists');
var pg;
if (moduleExists('pg-promise')) {
  pg = require('pg-promise')();
}

var pgConnect = function(res, queries, dbConfig) {

  var config = {
    user: dbConfig.user,
    password: dbConfig.password,
    host: dbConfig.connectString,
    port: dbConfig.port,
    database: dbConfig.database
  }
  var connection = pg(config);
  var searchResult = [];

  var promises = queries.map(function(query) {
    return connection.query(query.queryString)
      .then(function(result) {
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

  return Promise.all(promises)
    .then(function() {
      return searchResult;
    })
    .catch(function(err) {
      console.log('err');
      // ... error checks
    });
}

module.exports = pgConnect;
