module.exports = function() {

  var inskrivning = {
    referens: {
      beteckning: true,
      fastighetsnyckel: false
    },
    lagfart: {
      agare: {
        IDnummer: false,
        inskrivningsdag: true,
        dagboksnummer: false,
        beslut: false,
        BeviljadAndel: true,
        agare: true
      }
    },
    tomtratt: {
      beslut: false,
      inskrivningsdag: true,
      dagboksnummer: false,
      BeviljadAndel: true,
      agare: true
    }
  }

  return Object.create(inskrivning);

}
