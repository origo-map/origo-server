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
var excelCreator = require('../handlers/excelcreator');

var getAkt = require('../handlers/getakt');
var lmElevation = require('../handlers/lmelevation');
var lmSearchPlacename = require('../handlers/lmsearchplacename');
var lmEstate = require('../handlers/lmsearchestate');
var lmSearchAddress = require('../handlers/lmsearchaddress');
var lmGetEstate = require('../handlers/lmgetestate');
var iotProxy = require('../handlers/iotproxy');

/* GET start page. */
router.get('/', function (req, res) {
  res.render('index');
});

router.all('/addressestatesearch', searchAddressEstate);
router.all('/search', search);
router.all('/singlesearch', singleSearch);
router.all('/estate/inskrivning', getInskrivning);
router.all('/proxy', proxy);
router.all('/lmproxy/*', lmProxy);
router.all('/lmproxy-ver/*', lmProxyVer);
router.use('/excelcreator', excelCreator);

router.all('/document/*', getAkt);
router.all('/lm/elevation*', lmElevation);
router.all('/lm/placenames*', lmSearchPlacename);
router.all('/lm/enhetsomraden*', lmEstate['lmGetEstateFromPoint']);
router.all('/lm/registerenheter*', lmEstate['lmSearchEstate']);
router.all('/lm/addresses*', lmSearchAddress);
router.all('/lm/getestate*', lmGetEstate);
router.all('/iotproxy/*', iotProxy);

module.exports = router;
