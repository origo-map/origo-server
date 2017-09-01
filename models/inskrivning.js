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
    tomtrattsinnehav: {
      beslut: false,
      indskrivningdag: false,
      dagboksnummer: false,
      andel: true
    }
  }

  return Object.create(inskrivning);

}
