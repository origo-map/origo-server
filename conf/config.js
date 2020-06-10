module.exports = {
  mapState: {
    'storagePath': 'OrigoMapState' // Path to map state storage. Current path will save map state to a folder named OrigoMapState in the origo-server directory.
  },
  getInskrivning: {
    url: "https://api.lantmateriet.se/distribution/produkter/inskrivning/v2.1",
    url_token: "https://api.lantmateriet.se/token",
    consumer_key: '',
    consumer_secret: '',
    scope: 'am_application_scope default'
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
  lmelevation: {
    url: "https://api.lantmateriet.se/distribution/produkter/hojd/v1/rest/api",
    url_token: "https://api.lantmateriet.se/token",
    consumer_key: 'xxxxx',
    consumer_secret: 'xxxxx',
    scope: 'am_application_scope default'
  },
  lmsearchplacename: {
    url: "https://api.lantmateriet.se/distribution/produkter/ortnamn/v2",
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
  }
}
