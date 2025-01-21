var configutil = require('../lib/utils/configutil');

module.exports = {
  mapState: {
    'storagePath': process.env.ORIGOSERVER_MAPSTATE_STORAGEPATH ?? 'OrigoMapState' // Path to map state storage. Current path will save map state to a folder named OrigoMapState in the origo-server directory.
  },
  getInskrivning: {
    url: process.env.ORIGOSERVER_GETINSKRIVNING_URL ?? "https://api.lantmateriet.se/distribution/produkter/inskrivning/v3",
    url_token: process.env.ORIGOSERVER_GETINSKRIVNING_URL_TOKEN ?? "https://api.lantmateriet.se/token",
    consumer_key: process.env.ORIGOSERVER_GETINSKRIVNING_CONSUMER_KEY ?? '',
    consumer_secret: process.env.ORIGOSERVER_GETINSKRIVNING_CONSUMER_SECRET ?? '',
    scope: process.env.ORIGOSERVER_GETINSKRIVNING_SCOPE ?? 'inskrivning_direkt_v3_read'
  },
  getAkt: {
    url_token: process.env.ORIGOSERVER_GETAKT_URL_TOKEN ?? "https://api.lantmateriet.se/token",
    consumer_key: process.env.ORIGOSERVER_GETAKT_CONSUMER_KEY ?? '',
    consumer_secret: process.env.ORIGOSERVER_GETAKT_CONSUMER_SECRET ?? '',
    scope: process.env.ORIGOSERVER_GETAKT_SCOPE ?? 'am_application_scope default'
  },
  proxy: {
    proxyUrl: process.env.ORIGOSERVER_PROXY_PROXYURL ?? 'proxy?url='
  },
  'lmproxy-ver': {
    url: process.env.ORIGOSERVER_LMPROXY_VER_URL ?? "http://maps-ver.lantmateriet.se/",
    auth: {
      user: process.env.ORIGOSERVER_LMPROXY_VER_AUTH_USER ?? 'xxxxx',
      pass: process.env.ORIGOSERVER_LMPROXY_VER_AUTH_PASS ?? 'xxxxx'
    }
  },
  lmproxy: {
    url: process.env.ORIGOSERVER_LMPROXY_URL ?? "http://maps.lantmateriet.se/",
    auth: {
      user: process.env.ORIGOSERVER_LMPROXY_AUTH_USER ?? 'xxxxx',
      pass: process.env.ORIGOSERVER_LMPROXY_AUTH_PASS ?? 'xxxxx'
    }
  },
  lmbuilding: {
    url: process.env.ORIGOSERVER_LMBUILDING_URL ?? 'https://api.lantmateriet.se/distribution/produkter/byggnad/v3',
    url_token: process.env.ORIGOSERVER_LMBUILDING_URL_TOKEN ?? "https://apimanager.lantmateriet.se/oauth2/token",
    url_revoke: process.env.ORIGOSERVER_LMBUILDING_URL_REVOKE ?? "https://apimanager.lantmateriet.se/oauth2/revoke",
    consumer_key: process.env.ORIGOSERVER_LMBUILDING_CONSUMER_KEY ?? 'xxxxx',
    consumer_secret: process.env.ORIGOSERVER_LMBUILDING_CONSUMER_SECRET ?? 'xxxxx',
    scope: process.env.ORIGOSERVER_LMBUILDING_SCOPE ?? 'byggnad_direkt_v3_read'
  },
  lmelevation: {
    url: process.env.ORIGOSERVER_LMELEVATION_URL ?? "https://api.lantmateriet.se/distribution/produkter/hojd/v1/rest/api",
    url_token: process.env.ORIGOSERVER_LMELEVATION_URL_TOKEN ?? "https://apimanager.lantmateriet.se/oauth2/token",
    url_revoke: process.env.ORIGOSERVER_LMELEVATION_URL_REVOKE ?? "https://apimanager.lantmateriet.se/oauth2/revoke",
    consumer_key: process.env.ORIGOSERVER_LMELEVATION_CONSUMER_KEY ?? 'xxxxx',
    consumer_secret: process.env.ORIGOSERVER_LMELEVATION_CONSUMER_SECRET ?? 'xxxxx',
    scope: process.env.ORIGOSERVER_LMELEVATION_SCOPE ?? 'am_application_scope default'
  },
  lmsearchplacename: {
    url: process.env.ORIGOSERVER_LMSEARCHPLACENAME_URL ?? "https://api.lantmateriet.se/distribution/produkter/ortnamn/v2.1",
    url_token: process.env.ORIGOSERVER_LMSEARCHPLACENAME_URL_TOKEN ?? "https://api.lantmateriet.se/token",
    consumer_key: process.env.ORIGOSERVER_LMSEARCHPLACENAME_CONSUMER_KEY ?? 'xxxxx',
    consumer_secret: process.env.ORIGOSERVER_LMSEARCHPLACENAME_CONSUMER_SECRET ?? 'xxxxx',
    scope: process.env.ORIGOSERVER_LMSEARCHPLACENAME_SCOPE ?? 'am_application_scope default'
  },
  lmsearchestate: {
    url: process.env.ORIGOSERVER_LMSEARCHESTATE_URL ?? "https://api.lantmateriet.se/distribution/produkter/registerbeteckning/v5/",
    url_token: process.env.ORIGOSERVER_LMSEARCHESTATE_URL_TOKEN ??  "https://api.lantmateriet.se/token",
    consumer_key: process.env.ORIGOSERVER_LMSEARCHESTATE_CONSUMER_KEY ??  'xxxxx',
    consumer_secret: process.env.ORIGOSERVER_LMSEARCHESTATE_CONSUMER_SECRET ?? 'xxxxx',
    scope: process.env.ORIGOSERVER_LMSEARCHESTATE_SCOPE ?? 'registerbeteckning_direkt_v5_read'
  },
  lmsearchaddress: {
    url: process.env.ORIGOSERVER_LMSEARCHADDRESS_URL ?? "https://api.lantmateriet.se/distribution/produkter/belagenhetsadress/v4.2",
    url_token: process.env.ORIGOSERVER_LMSEARCHADDRESS_URL_TOKEN ?? "https://api.lantmateriet.se/token",
    consumer_key: process.env.ORIGOSERVER_LMSEARCHADDRESS_CONSUMER_KEY ?? 'xxxxx',
    consumer_secret: process.env.ORIGOSERVER_LMSEARCHADDRESS_CONSUMER_SECRET ?? 'xxxxx',
    scope: process.env.ORIGOSERVER_LMSEARCHADDRESS_SCOPE ?? 'belagenhetsadress_direkt_v42_read'
  },
  lmgetestate: {
    url: process.env.ORIGOSERVER_LMGETESTATE_URL ?? "https://api.lantmateriet.se/distribution/produkter/fastighetsamfallighet/v3.1",
    url_token: process.env.ORIGOSERVER_LMGETESTATE_URL_TOKEN ?? "https://api.lantmateriet.se/token",
    consumer_key: process.env.ORIGOSERVER_LMGETESTATE_CONSUMER_KEY ?? 'xxxxx',
    consumer_secret: process.env.ORIGOSERVER_LMGETESTATE_CONSUMER_SECRET ?? 'xxxxx',
    scope: process.env.ORIGOSERVER_LMGETESTATE_SCOPE ?? 'fastighetochsamfallighet_direkt_v31_read'
  },
  cors: {
    origin: process.env.ORIGOSERVER_CORS_ORIGIN ?? '*',
    methods: ['GET', 'PUT', 'POST', 'OPTIONS', 'PATCH', 'DELETE'],
    headers: process.env.ORIGOSERVER_CORS_HEADERS ?? 'X-Requested-With,content-type',
    credentials: configutil.convertToBoolean(process.env.ORIGOSERVER_CORS_CREDENTIALS) ?? true,
    optionsSuccessStatus: configutil.convertToNumber(process.env.ORIGOSERVER_CORS_OPTIONSSUCCESSSTATUS) ?? 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  },
  'iotproxy': {
    services: [
      {
        name: "temperature",
        url: "https://example.com/ngsi-ld/v1/entities?type=WeatherObserved&attrs=temperature",
        title: "Temperature",
        properties: ['temperature', 'dateObserved']
      }
    ]
  },
  'overpass': {
    queries: [
      {
        name: "amenityFuelBBox",
        query: "[out:json];node(62.1,16.2,63.0,17.8)[amenity=fuel];out;",
        title: "Get all amenity:fuel for bbox around Sundsvall",
        options: "{}"
      }
    ]
  },
  'tvapi': {
    services: [
      {
        name: 'situation',
        url: 'https://api.trafikinfo.trafikverket.se/v2/data.json',
        title: 'Situationer i Västernorrland',
        query: '<REQUEST><LOGIN authenticationkey="xxxxx"/><QUERY runtime="true" objecttype="Situation" schemaversion="1.4"><FILTER><IN name="Deviation.CountyNo" value="22" /></FILTER></QUERY></REQUEST>',
        type: 'Situation'
      }
    ]
  },
  'convertToGeojson': {
    converts: [
      {
        name: 'example',
        url: 'https://example.com/getitems',
        title: 'Example, points',
        arrayOfObjects: 'example',
        geometry: 'point',
        geometry_type: 'Point',
        geometry_format: 'Array',
        properties: ['title', 'description', 'restrictions', 'level', 'start', 'end'],
        encoding: 'iso-8859-1'
      }
    ]
  },
  auth: {
    openidIssuer: process.env.ORIGOSERVER_AUTH_OPENIDISSUER ?? 'https://openid-provider/.well-known/openid-configuration',
    redirect_uri: process.env.ORIGOSERVER_AUTH_REDIRECT_URI ?? 'https://karta.xxx.se',
    http_timeout: configutil.convertToNumber(process.env.ORIGOSERVER_AUTH_HTTP_TIMEOUT) ?? 10000,
    client_id: process.env.ORIGOSERVER_AUTH_CLIENT_ID ?? 'xxxxx',
    client_secret: process.env.ORIGOSERVER_AUTH_CLIENT_SECRET ?? 'xxxxx',
    display_name: process.env.ORIGOSERVER_AUTH_DISPLAY_NAME ?? 'samaccountname',
    clients: {
      my_client: process.env.ORIGOSERVER_AUTH_MY_CLIENT ?? 'https://www.myclient.se',
      my_other_client: process.env.ORIGOSERVER_AUTH_MY_OTHER_CLIENT ?? 'https://www.myotherclient.com'
    }
  },
  ngpDetaljplan: {
    url_base: process.env.ORIGOSERVER_NGPDETALJPLAN_URL_BASE ?? "https://api.lantmateriet.se/",
    client_key: process.env.ORIGOSERVER_NGPDETALJPLAN_CLIENT_KEY ?? 'xxxxx',
    client_secret: process.env.ORIGOSERVER_NGPDETALJPLAN_CLIENT_SECRET ?? 'xxxxx',
    grant_type: process.env.ORIGOSERVER_NGPDETALJPLAN_GRANT_TYPE ?? 'client_credentials',
    scope: process.env.ORIGOSERVER_NGPDETALJPLAN_SCOPE ?? 'am_application_scope default',
    query: process.env.ORIGOSERVER_NGPDETALJPLAN_QUERY ?? '{"feature.typ": {"eq": "detaljplan"}, "detaljplan.objektidentitet": {"eq": "$planid$"}, "detaljplan.status": {"in": ["laga kraft"]}}'
  }
}
