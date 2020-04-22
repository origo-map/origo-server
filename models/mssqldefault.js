var mssqlDefault = function mssqlDefault(queryString, queryOptions, defaultLimit) {
  var schema = queryOptions.schema;
  var database = queryOptions.database;
  var table = queryOptions.table;
  var searchField = queryOptions.searchField;
  var sqlSearchField = searchField ? searchField + " AS NAMN," : "";
  var fields = queryOptions.fields;
  var geometryField = queryOptions.geometryName || "geom";
  var useCentroid = queryOptions.hasOwnProperty("useCentroid") ? queryOptions.useCentroid : true;
  var wkt = useCentroid ? geometryField + ".STPointOnSurface().ToString() AS GEOM " + " " :
    geometryField + ".ToString() AS GEOM " + " ";
  var sqlFields = fields ? fields.join(',') + "," : "";
  var type = " '" + table + "'" + " AS TYPE, ";
  var condition = queryString;
  var searchString;
  var limitNumber = queryOptions.limit || defaultLimit || 1000;
  var limit = "TOP " + limitNumber.toString() + " ";

  searchString =
    "SELECT " + limit +
    sqlSearchField + sqlFields + type + wkt +
    " FROM " + database + "." + schema + "." + table +
    " WHERE LOWER(" + searchField + ") LIKE LOWER('" + condition + "%')" + " " +
    " ORDER BY " + searchField + "";

  return searchString;
}

module.exports = mssqlDefault;
