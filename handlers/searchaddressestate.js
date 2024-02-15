var dbConfig = require('../conf/dbconfig');
var dbConnectors = require('../lib/dbconnectors');
var searchModel = require('../conf/dbconfig').models.addressEstate;
var dbType = require('../lib/dbtype');
var sendResponse = require('../lib/sendresponse');
var model = require('../models/dbmodels');

var searchAddressEstate = function(req, res) {
  var query = req.query.q;
  var connector = dbConfig.connectors.addressEstate;
  var addressModel = searchModel.addresses;
  var estatesModel = searchModel.estates;

  addressModel.limit = addressModel.limit || dbConfig.limit;
  estatesModel.limit = estatesModel.limit || dbConfig.limit;
  if (req.query.limit) {
    addressModel.limit = addressModel.limit ? Math.min(addressModel.limit, req.query.limit) : req.query.limit;
    estatesModel.limit = estatesModel.limit ? Math.min(estatesModel.limit, req.query.limit) : req.query.limit;
  } else {
    addressModel.limit = addressModel.limit || 100;
    estatesModel.limit = estatesModel.limit || 100;
  }

  var db = dbType(connector);
  var addressString = model[db](query, addressModel);
  var estatesString = model[db](query, estatesModel);

  var queries = [];

  queries.push({
    queryString: addressString,
    cb: addressCb
  });
  queries.push({
    queryString: estatesString,
    cb: estateCb
  });

  dbConnectors[db](res, queries, connector[db])
    .then(function(result) {
      sendResponse(res, JSON.stringify(result));
    });
};

function estateCb(result) {
  return result.map(function(row) {
    row.NAMN += ', ' + row.KOMMUNNAMN;
    delete row.KOMMUNNAMN;
    return row;
  });
}

function addressCb(result) {
  return result.map(function(row) {
    row.NAMN += ', ' + row.KOMDELLAGE;
    delete row.KOMDELLAGE;
    return row;
  });
}

module.exports = searchAddressEstate;
