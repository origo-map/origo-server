var express = require('express');
var router = express.Router();
var conf = require('../conf/config');

//handlers
var searchAddressEstate = require('../handlers/searchaddressestate');
var search = require('../handlers/search');
var singleSearch = require('../handlers/singlesearch');
var getInskrivning = require('../handlers/getinskrivning');
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
var overpass = require('../handlers/overpass');
var tvApi = require('../handlers/tvapi');
var convertToGeojson = require('../handlers/converttogeojson');
var lmBuilding = require('../handlers/lmbuilding');
var ngp = require('../handlers/ngp');
var lmCommunityAssociation = require('../handlers/lmcommunityassociation');

/* GET start page. */
router.get('/', function (req, res) {
  res.render('index');
});

router.all('/addressestatesearch', searchAddressEstate);
router.all('/search', search);
router.all('/singlesearch', singleSearch);
router.all('/estate/inskrivning', getInskrivning);
// The proxy is only enabled if conf.proxy exists, since the handler reads conf.proxy when it is loaded.
if (conf['proxy']) {
  router.all('/proxy', require('../handlers/proxy'));
}
router.all('/lmproxy/*splat', lmProxy);
router.all('/lmproxy-ver/*splat', lmProxyVer);
router.use('/excelcreator', excelCreator);

router.all('/document/*splat', getAkt);
router.all('/lm/elevation*splat', lmElevation);
router.all('/lm/placenames', lmSearchPlacename);
router.all('/lm/enhetsomraden', lmEstate['lmGetEstateFromPoint']);
router.all('/lm/registerenheter', lmEstate['lmSearchEstate']);
router.all('/lm/registerenheter/*splat', lmEstate['lmSearchEstate']);
router.all('/lm/addresses', lmSearchAddress);
router.all('/lm/getestate', lmGetEstate);
router.all('/lm/building', lmBuilding);
router.all('/lm/communityassociation*splat', lmCommunityAssociation);
router.all('/iotproxy/', iotProxy);
router.all('/overpass/', overpass);
router.all('/tvapi/', tvApi);
router.all('/converttogeojson/', convertToGeojson);
// Login is only enabled if conf.auth exists, since the auth and clients handlers read conf.auth.
if (conf['auth']) {
  router.use('/auth', require('../handlers/auth'));
  router.use('/clients', require('../handlers/clients'));
}
router.use('/ngp', ngp);
// Attachments are only enabled if conf.attachment exists, since the handler reads conf.attachment when it is loaded.
if (conf['attachment']) {
  router.use('/attachment', require('../handlers/attachment'));
}

module.exports = router;
