module.exports = function() {

  var inskrivning = {
    referens: {
      beteckning: true,
      fastighetsnyckel: false
    },
    lagfart: {
      IDnummer: false,
      inskrivningsdag: true,
      dagboksnummer: false,
      beslut: false,
      BeviljadAndel: true,
      agare: true
    },
    tomtratt: {
      IDnummer: false,
      beslut: false,
      inskrivningsdag: true,
      dagboksnummer: false,
      BeviljadAndel: true,
      agare: true
    }
  };

  return Object.create(inskrivning);

}
