var Configutil = function() {

  /**
   * Converts a string value to a number value. Returns undefined if
   * value is null or undefined.
   *
   * @param  value: The value to convert to Number.
   * @throws {Error} If the value can't be parsed to Number.
   * @return {Number} Returns the value as the type Number,
   * or undefined.
   */
  function convertToNumber(value) {
    var defaultResult = undefined;

    if (value == null) { 
      return defaultResult; 
    }
    
    const number = Number(value);
    if (isNaN(number)){
      throw new Error("The function convertToNumber failed to convert value to number.");
    }
    else {
      return number;
    }
  }

  /**
   * Converts a string value to a boolean value. The value needs
   * to be "true" or "false", and the matching to these values is 
   * case insensitive. Returns undefined if value is null or 
   * undefined.
   *
   * @param  value: The value to convert to Boolean.
   * @throws {Error} If the value can't be parsed to Boolean.
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
      throw new Error("The function convertToBoolean failed to convert value to boolean.");
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
