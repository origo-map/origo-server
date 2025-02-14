var pgDefault = function pgDefault(queryString, queryOptions) {
  var schema = queryOptions.schema;
  var table = queryOptions.table;
  var searchField = queryOptions.searchField;
  var gid = queryOptions.gid || 'gid';
  var sqlSearchField = searchField ? 'CAST("' + table + '"."' + searchField + '" AS TEXT) AS "NAMN",' : "";
  var fields = queryOptions.fields;
  var geometryField = queryOptions.geometryName || "geom";
  var useCentroid = queryOptions.hasOwnProperty("useCentroid") ? queryOptions.useCentroid : true;
  var wkt = useCentroid ? 'ST_AsText(ST_PointOnSurface(' + table + '."' + geometryField + '")) AS "GEOM" ' :
    'ST_AsText("' + table + '"."' + geometryField + '") AS "GEOM" ';
  var sqlFields = fields ? fields.join(',') + "," : "";
  var type = " '" + table + "'" + ' AS "TYPE", ';
  var title = queryOptions.title ? " '" + queryOptions.title + "'" + ' AS "TITLE", ' : '';
  var condition = queryString;
  var searchString;
  var limit = queryOptions.limit ? ' LIMIT ' + queryOptions.limit.toString() + ' ' : '';

  searchString =
    'SELECT ' +
    sqlSearchField +
    ' "' + table + '"."' + gid + '" AS "GID", ' +
    sqlFields +
    type +
    title +
    wkt +
    ' FROM ' + schema + '."' + table + '"' +
    ' WHERE LOWER(CAST("' + table + '"."' + searchField + '"' + " AS TEXT)) ILIKE LOWER('" + condition + "%')" +
    ' ORDER BY "' + table + '"."' + searchField + '"' +
    limit + ';';

  return searchString;
}

module.exports = pgDefault;
