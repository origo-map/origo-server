function getDbType(dbObj) {
  if (dbObj.hasOwnProperty('mssql')) {
    return 'mssql';
  } else if (dbObj.hasOwnProperty('oracle')) {
    return 'oracle';
  } else if (dbObj.hasOwnProperty('pg')) {
    return 'pg';
  } else {
    console.log('Database driver is not defined');
    return 'undefined';
  }
}

module.exports = function(dbObj) {
  if (dbObj) {
    return getDbType(dbObj);
  } else {
    console.log('Database connector not defined');
  }
}
