var express = require('express');
var router = express.Router();
var excel = require('exceljs');

router.options('/', function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);
  // console.log('options');
  next();
});

router.post('/', postHandler);

function postHandler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  var workbook = new excel.Workbook(); //creating workbook
  var sheet = workbook.addWorksheet('MySheet'); //creating worksheet

  var objArray = req.body;

  Object.entries(objArray).forEach(entry => {
    // console.log(entry[0]);
    sheet.addRow([entry[0]]);
    sheet.addRow(Object.keys(entry[1][0]));
  
    entry[1].forEach(function (item) {
      sheet.addRow(Object.values(item));
    });

    sheet.addRow(); // add an empty row between each layer
  });

  var options = {
    // root: __dirname + '/../',
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  };

  var fileName = './public/temp.xlsx';
  workbook.xlsx.writeFile(fileName)
    .then(function () {
      console.log("file is written");
      res.setHeader('content-type', 'application/download');
      res.download(fileName, 'ExportedFeatures.xlsx', options, function (err) {
        if (err) {
          console.log('Error sending file: ', err);
        } else {
          console.log('Sent: ', fileName);
        }
      });
    })
    .catch(function (err) {
      console.log("Error writing file.");
      console.log(err);
    });
}

module.exports = router;
