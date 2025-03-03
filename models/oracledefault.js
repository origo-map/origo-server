var oracleDefault = function oracleDefault(queryString, queryOptions) {
  var schema = queryOptions.schema;
  var table = queryOptions.table;
  var searchField = queryOptions.searchField;
  var sqlSearchField = searchField ? searchField + " AS NAMN," : "";
  var fields = queryOptions.fields;
  var geometryField = queryOptions.geometryName || "geom";
  var useCentroid = queryOptions.hasOwnProperty("useCentroid") ? queryOptions.useCentroid : true;
  var wkt = useCentroid ? "TO_CHAR(SDO_UTIL.TO_WKTGEOMETRY(SDO_GEOM.SDO_CENTROID(" + geometryField + ", m.diminfo))) AS GEOM" :
    "TO_CHAR(SDO_UTIL.TO_WKTGEOMETRY(" + geometryField + ")) AS GEOM";
  var sqlFields = fields ? fields.join(',') + "," : "";
  var title = queryOptions.title ? " '" + queryOptions.title + "'" + ' AS TITLE, ' : '';
  var condition = queryString;
  var searchString;
  var sdo_geom_metadata;
  if (queryOptions.hasOwnProperty('metadata')) {
    sdo_geom_metadata = "m.table_name = '" + queryOptions.metadata.table +
      "' AND m.column_name = '" + queryOptions.metadata.geometryField;
  } else {
    sdo_geom_metadata = "m.table_name = '" + table + "' AND m.column_name = '" + geometryField;
  }
  var limit = queryOptions.limit ? " FETCH FIRST " + queryOptions.limit.toString() + " ROWS ONLY" : "";

  searchString =
    "SELECT " +
    sqlSearchField +
    sqlFields +
    "'" + table + "'" + " AS type," +
    title +
    wkt + " " +
    "FROM " + schema + "." + table + ", user_sdo_geom_metadata m " +
    "WHERE " + sdo_geom_metadata + "' AND lower(" + searchField + ") LIKE lower('" + condition + "%')" + " " +
    "ORDER BY " + searchField +
    limit;

  return searchString;
}

module.exports = oracleDefault;
