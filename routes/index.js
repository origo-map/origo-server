var express = require('express');
var router = express.Router();

//handlers
var searchAddressEstate = require('../handlers/searchaddressestate');
var search = require('../handlers/search');
var singleSearch = require('../handlers/singlesearch');
var getInskrivning = require('../handlers/getinskrivning');


/* GET start page. */
router.get('/', function(req, res) {
  res.render('index');
});

router.all('/addressestatesearch', searchAddressEstate);
router.all('/search', search);
router.all('/singlesearch', singleSearch);
router.all('/estate/inskrivning', getInskrivning);

module.exports = router;
