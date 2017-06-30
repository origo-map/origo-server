var moduleExists = function moduleExists(name) {
  try {
    return require.resolve(name);
  } catch (e) {
    console.error(name + ' is not found');
    return false;
  }
}

module.exports = moduleExists;
