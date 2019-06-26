module.exports = {
  getInskrivning: {
    url: 'https://services.lantmateriet.se/distribution/produkter/inskrivning/v2.1',
    user: 'xxxxx',
    password: 'xxxxx'
  },
  getAkt: {
    consumer_key: '',
    consumer_secret: '',
    scope: ''
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
  }
}
