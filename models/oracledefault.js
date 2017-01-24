var oracleDefault = function oracleDefault(queryString, queryOptions) {
  var schema = queryOptions.schema;
  var table = queryOptions.table;
  var searchField = queryOptions.searchField;
  var sqlSearchField = searchField ? searchField + " AS NAMN," : "";
  var fields = queryOptions.fields;
  var geometryField = queryOptions.geometryName || "SHAPE";
  var sqlFields = fields ? fields.join(',') + "," : "";
  var condition = queryString;
  var searchString;
  var sdo_geom_metadata;
  if (queryOptions.hasOwnProperty('metadata')) {
    sdo_geom_metadata = "m.table_name = '" + queryOptions.metadata.table +
      "' AND m.column_name = '" + queryOptions.metadata.geometryField;
  } else {
    sdo_geom_metadata = "m.table_name = '" + table + "' AND m.column_name = '" + geometryField;
  }

  searchString =
    "SELECT " + sqlSearchField + sqlFields + "'" + table + "'" + " AS type," +
    "TO_CHAR(SDO_UTIL.TO_WKTGEOMETRY(SDO_GEOM.SDO_CENTROID(" + geometryField + ", m.diminfo))) AS GEOM" + " " +
    "FROM " + schema + "." + table + ", user_sdo_geom_metadata m " +
    "WHERE " + sdo_geom_metadata + "' AND lower(" + searchField + ") LIKE lower('" + condition + "%')" + " " +
    "ORDER BY " + searchField + "";

  return searchString;
}

module.exports = oracleDefault;
