var pgDefault = function pgDefault(queryString, queryOptions) {
  var schema = queryOptions.schema;
  var table = queryOptions.table;
  var customType = queryOptions.customType;
  var searchField = queryOptions.searchField;
  var gid = queryOptions.gid || 'gid';
  var fields = queryOptions.fields;
  var geometryField = queryOptions.geometryName || "geom";
  var useCentroid = queryOptions.hasOwnProperty("useCentroid") ? queryOptions.useCentroid : true;
  var values = [queryString + '%'];
  var selectFields = [];

  if (searchField) {
    selectFields.push('CAST(' + qualifiedIdentifier(table, searchField) + ' AS TEXT) AS "NAMN"');
  }
  selectFields.push(qualifiedIdentifier(table, gid) + ' AS "GID"');
  if (fields) {
    fields.forEach(function(field) {
      selectFields.push(qualifiedIdentifier(table, field));
    });
  }

  values.push(customType ?? table);
  selectFields.push('$' + values.length + ' AS "TYPE"');
  if (queryOptions.title) {
    values.push(queryOptions.title);
    selectFields.push('$' + values.length + ' AS "TITLE"');
  }

  var wkt = useCentroid ? 'ST_AsText(ST_PointOnSurface(' + qualifiedIdentifier(table, geometryField) + ')) AS "GEOM"' :
    'ST_AsText(' + qualifiedIdentifier(table, geometryField) + ') AS "GEOM"';
  selectFields.push(wkt);

  var searchString =
    'SELECT ' + selectFields.join(', ') +
    ' FROM ' + qualifiedIdentifier(schema, table) +
    ' WHERE LOWER(CAST(' + qualifiedIdentifier(table, searchField) + ' AS TEXT)) ILIKE LOWER($1)' +
    ' ORDER BY ' + qualifiedIdentifier(table, searchField);

  if (queryOptions.limit) {
    values.push(queryOptions.limit);
    searchString += ' LIMIT $' + values.length;
  }

  return {
    queryString: searchString + ';',
    values: values
  };
};

function qualifiedIdentifier() {
  return Array.prototype.map.call(arguments, quoteIdentifier).join('.');
}

function quoteIdentifier(identifier) {
  return '"' + String(identifier).replace(/"/g, '""') + '"';
}

module.exports = pgDefault;
