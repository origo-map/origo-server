var express = require('express');
var router = express.Router();

//handlers
var searchAddressEstate = require('../handlers/searchaddressestate');
var search = require('../handlers/search');
var singleSearch = require('../handlers/singlesearch');
var getInskrivning = require('../handlers/getinskrivning');
var proxy = require('../handlers/proxy');
var lmProxy = require('../handlers/lmproxy');
var lmProxyVer = require('../handlers/lmproxyver');


/* GET start page. */
router.get('/', function(req, res) {
  res.render('index');
});

router.all('/addressestatesearch', searchAddressEstate);
router.all('/search', search);
router.all('/singlesearch', singleSearch);
router.all('/estate/inskrivning', getInskrivning);
router.all('/proxy', proxy);
router.all('/lmproxy/*', lmProxy);
router.all('/lmproxy-ver/*', lmProxyVer);

module.exports = router;
