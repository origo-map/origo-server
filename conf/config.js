module.exports = {
  mapState: {
    'storagePath': 'OrigoMapState' // Path to map state storage. Current path will save map state to a folder named OrigoMapState in the origo-server directory.
  },
  getInskrivning: {
    url: "https://api.lantmateriet.se/distribution/produkter/inskrivning/v3",
    url_token: "https://api.lantmateriet.se/token",
    consumer_key: '',
    consumer_secret: '',
    scope: 'inskrivning_direkt_v3_read'
  },
  getAkt: {
    url_token: "https://api.lantmateriet.se/token",
    consumer_key: '',
    consumer_secret: '',
    scope: 'am_application_scope default'
  },
  proxy: {
    proxyUrl: 'proxy?url='
  },
  'lmproxy-ver': {
    url: "http://maps-ver.lantmateriet.se/",
    auth: {
      user: 'xxxxx',
      pass: 'xxxxx'
    }
  },
  lmproxy: {
    url: "http://maps.lantmateriet.se/",
    auth: {
      user: 'xxxxx',
      pass: 'xxxxx'
    }
  },
  lmbuilding: {
    url: 'https://api.lantmateriet.se/distribution/produkter/byggnad/v2',
    url_token: "https://api.lantmateriet.se/token",
    consumer_key: 'xxxxx',
    consumer_secret: 'xxxxx',
    scope: 'am_application_scope default'
  },
  lmelevation: {
    url: "https://api.lantmateriet.se/distribution/produkter/hojd/v1/rest/api",
    url_token: "https://api.lantmateriet.se/token",
    consumer_key: 'xxxxx',
    consumer_secret: 'xxxxx',
    scope: 'am_application_scope default'
  },
  lmsearchplacename: {
    url: "https://api.lantmateriet.se/distribution/produkter/ortnamn/v2.1",
    url_token: "https://api.lantmateriet.se/token",
    consumer_key: 'xxxxx',
    consumer_secret: 'xxxxx',
    scope: 'am_application_scope default'
  },
  lmsearchestate: {
    url: "https://api.lantmateriet.se/distribution/produkter/registerbeteckning/v4/",
    url_token: "https://api.lantmateriet.se/token",
    consumer_key: 'xxxxx',
    consumer_secret: 'xxxxx',
    scope: 'am_application_scope default'
  },
  lmsearchaddress: {
    url: "https://api.lantmateriet.se/distribution/produkter/belagenhetsadress/v4.1/",
    url_token: "https://api.lantmateriet.se/token",
    consumer_key: 'xxxxx',
    consumer_secret: 'xxxxx',
    scope: 'am_application_scope default'
  },
  lmgetestate: {
    url: "https://api.lantmateriet.se/distribution/produkter/fastighet/v2.1/",
    url_token: "https://api.lantmateriet.se/token",
    consumer_key: 'xxxxx',
    consumer_secret: 'xxxxx',
    scope: 'am_application_scope default'
  },
  cors: {
    origin: '*',
    methods: ['GET', 'PUT', 'POST', 'OPTIONS', 'PATCH', 'DELETE'],
    headers: 'X-Requested-With,content-type',
    credentials: true,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
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
  }
}
