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
var overpass = require('../handlers/overpass');
var tvApi = require('../handlers/tvapi');
var convertToGeojson = require('../handlers/converttogeojson');
var lmBuilding = require('../handlers/lmbuilding');
var auth = require('../handlers/auth');
var clients = require('../handlers/clients');
var ngp = require('../handlers/ngp');
var attachment = require('../handlers/attachment');
var lmCommunityAssociation = require('../handlers/lmcommunityassociation');

/* GET start page. */
router.get('/', function (req, res) {
  res.render('index');
});

router.all('/addressestatesearch', searchAddressEstate);
router.all('/search', search);
router.all('/singlesearch', singleSearch);
router.all('/estate/inskrivning', getInskrivning);
router.all('/proxy', proxy);
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
router.use('/auth', auth);
router.use('/clients', clients);
router.use('/ngp', ngp);
router.use('/attachment', attachment);

module.exports = router;
