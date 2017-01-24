var dbModels = {};

dbModels.oracle = require('./oracledefault');
dbModels.mssql = require('./mssqldefault');
dbModels.pg = require('./pgdefault');

module.exports = dbModels;
