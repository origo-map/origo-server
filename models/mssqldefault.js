var mssqlDefault = function mssqlDefault(queryString, queryOptions, defaultLimit) {
  var schema = queryOptions.schema;
  var database = queryOptions.database;
  var table = queryOptions.table;
  var searchField = queryOptions.searchField;
  var sqlSearchField = searchField ? searchField + " AS NAMN," : "";
  var fields = queryOptions.fields;
  var geometryField = queryOptions.geometryName || "SHAPE";
  var centroid = geometryField + ".STPointOnSurface().ToString() AS GEOM " + " ";
  var sqlFields = fields ? fields.join(',') + "," : "";
  var type = " '" + table + "'" + " AS TYPE, ";
  var condition = queryString;
  var searchString;
  var limitNumber = queryOptions.limit || defaultLimit || 1000;
  var limit = "TOP " + limitNumber.toString() + " ";

  searchString =
    "SELECT " + limit +
    sqlSearchField + sqlFields + type + centroid +
    " FROM " + database + "." + schema + "." + table +
    " WHERE LOWER(" + searchField + ") LIKE LOWER('" + condition + "%')" + " " +
    " ORDER BY " + searchField + "";

  return searchString;
}

module.exports = mssqlDefault;
