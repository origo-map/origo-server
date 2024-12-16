var Configutil = function() {

  /**
   * Converts a string value to a number value. The value 
   * undefined is returned if the string doesn't contain a
   * number.
   *
   * @param  value: The value to convert to Number.
   * @return {Number} Returns the value as the type Number,
   * or undefined.
   */
  function convertToNumber(value) {
    var defaultResult = undefined;

    if (value == null) { 
        return defaultResult; 
    }
    
    const number = Number(value);
    return isNaN(number) ? defaultResult : number;
  }

  /**
   * Converts a string value to a boolean value. The value needs
   * to be "true" or "false", and the matching to these values is 
   * case insensitive. Other input makes this funtion return
   * undefined.
   *
   * @param  value: The value to convert to Bboolean.
   * @return {Boolean} Returns true, false or undefined.
   */
  function convertToBoolean(value) {
    var defaultResult = undefined;

    if (value == null) { 
        return defaultResult; 
    }

    const stringValue = String(value).toLowerCase();

    if (stringValue === 'true') {
      return true;
    }
    else if (stringValue === 'false') {
      return false;
    }
    else {
      return defaultResult;
    }
}

  return {
		
    convertToNumber: function(value) {
      return convertToNumber(value);
    },
    convertToBoolean: function(value) {
      return convertToBoolean(value);
    }
    
  };

}

module.exports = Configutil();
