module.exports = {
  getInskrivning: {
      url: 'https://services-ver.lantmateriet.se/distribution/produkter/inskrivning/v2.1',
      user: 'xxxxx',
      password: 'xxxxx'
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
