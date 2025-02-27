var mssqlDefault = function mssqlDefault(queryString, queryOptions) {
  var schema = queryOptions.schema;
  var database = queryOptions.database;
  var table = queryOptions.table;
  var customType = queryOptions.customType;
  var searchField = queryOptions.searchField;
  var sqlSearchField = searchField ? searchField + " AS NAMN," : "";
  var fields = queryOptions.fields;
  var geometryField = queryOptions.geometryName || "geom";
  var useCentroid = queryOptions.hasOwnProperty("useCentroid") ? queryOptions.useCentroid : true;
  var wkt = useCentroid ? geometryField + ".STPointOnSurface().ToString() AS GEOM " + " " :
    geometryField + ".ToString() AS GEOM " + " ";
  var sqlFields = fields ? fields.join(',') + "," : "";
  var type = " '" + (customType ?? table) + "'" + " AS TYPE, ";
  var title = queryOptions.title ? " '" + queryOptions.title + "'" + ' AS "TITLE", ' : '';
  var condition = queryString;
  var searchString;
  var limit = queryOptions.limit ? "TOP " + queryOptions.limit.toString() + " " : "";

  searchString =
    "SELECT " + limit +
    sqlSearchField +
    sqlFields +
    type +
    title +
    wkt +
    " FROM " + database + "." + schema + "." + table +
    " WHERE LOWER(" + searchField + ") LIKE LOWER('" + condition + "%')" + " " +
    " ORDER BY " + searchField + "";

  return searchString;
};

module.exports = mssqlDefault;
