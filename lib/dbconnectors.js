var dbConnectors = {};
dbConnectors.oracle = require('./oracle');
dbConnectors.mssql = require('./mssql');
dbConnectors.pg = require('./pg');

module.exports = dbConnectors;
