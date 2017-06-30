var moduleExists = require('./utils/moduleexists');
var oracledb;
if (moduleExists('oracledb')) {
  oracledb = require('oracledb');
  oracledb.Promise = Promise;
}

var oracleConnect = function(res, queries, dbConfig) {
  var searchResult = [];
  return oracledb.getConnection({
      user: dbConfig.user,
      password: dbConfig.password,
      connectString: dbConfig.connectString
    })
    .then(function(connection) {
      var promises = queries.map(function(query) {
        return connection.execute(
            query.queryString, [], {
              maxRows: 10,
              outFormat: oracledb.OBJECT
            }
          )
          .then(function(result) {
            if (query.hasOwnProperty('cb')) {
              searchResult = searchResult.concat(query.cb(result.rows));
            } else {
              searchResult = searchResult.concat(result.rows);
            }
          })
          .catch(function(err) {
            console.error(err);
            return connection.close();
          });
      });
      return Promise.all(promises).then(function() {
        doRelease(connection);
        return searchResult;
      });
    })
    .catch(function(err) {
      console.error(err);
    });
}

function doRelease(connection) {
  connection.release(
    function(err) {
      if (err) {
        console.error(err.message);
      }
    });
}

module.exports = oracleConnect;
