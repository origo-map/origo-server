var express = require('express');
var router = express.Router();
var excel = require('exceljs');
var cors = require('cors')

router.use(cors());

router.post('/', postHandler);

function postHandler(req, res) {

  var workbook = new excel.Workbook(); //creating workbook
  var sheet = workbook.addWorksheet('MySheet'); //creating worksheet

  var objArray = req.body;

  Object.entries(objArray).forEach(entry => {
    sheet.addRow([entry[0]]);
    sheet.addRow(Object.keys(entry[1][0]));

    entry[1].forEach(function (item) {
      sheet.addRow(Object.values(item));
    });

    sheet.addRow(); // add an empty row between each layer
  });

  var options = {
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
      res.setHeader('content-type', 'application/vnd.ms-excel');
      res.statusMessage = "Custom Status Message";
      res.customName = "File Name";
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
