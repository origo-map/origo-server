var connectionExists = function connectionExists(config, connections) {
  var exists = false;
  connections.forEach(function(obj) {
    if (JSON.stringify(obj.config) === JSON.stringify(config)) {
      exists = obj.connection;
    }
  });
  return exists;
}

module.exports = connectionExists;
