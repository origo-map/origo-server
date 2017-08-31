module.exports = function() {

  var inskrivning = {
    beteckning: undefined,
    lagfart: [],
    inskrivningsdag: false,
    dagboksnummer: false,
    beslut: false,
    agare: {
      idNummer: false,
      organisation: {
        juridiskForm: false
      },
      andel: true
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
