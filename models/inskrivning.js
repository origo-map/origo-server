module.exports = function() {

  var inskrivning = {
    referens: {
      beteckning: true,
      objektidentitet: false
    },
    lagfart: {
      idnummer: false,
      inskrivningsdag: true,
      dagboksnummer: false,
      beslut: false,
      beviljadAndel: true,
      agare: true
    },
    tomtratt: {
      idnummer: false,
      beslut: false,
      inskrivningsdag: true,
      dagboksnummer: false,
      beviljadAndel: true,
      agare: true
    },
    tidigareAgande: {
      idnummer: false,
      beslut: false,
      inskrivningsdag: true,
      dagboksnummer: false,
      beviljadAndel: false,
      agare: true,
      typ: false
    }
  };

  return Object.create(inskrivning);

}
