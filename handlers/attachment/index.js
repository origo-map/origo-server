var conf = require('../../conf/config');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { listAttachments, fetchDoc, deleteAttachments, deleteAllAttachments, listAllAttachments } = require('./attachments');
const multer = require('multer');
const getUuid = require('uuid-by-string');
const attachmentRouter = express.Router();

// Let the upload middleware buffer the file in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

let configOptions = {};

if (conf['attachment']) {
    configOptions = Object.assign({}, conf['attachment']);
}

attachmentRouter.get('/:layer/:object/attachments/', listAttachments);
attachmentRouter.get('/:layer/attachments/', listAllAttachments);
attachmentRouter.get('/:layer/:object/attachments/:id', fetchDoc);
attachmentRouter.get('/:layer/:object/deleteAttachments/', deleteAllAttachments);
attachmentRouter.post('/:layer/:object/deleteAttachments/', deleteAttachments);
attachmentRouter.post('/:layer/:object/addAttachment', upload.single('attachment'), function (req, res, next) {
    const dir = path.join(configOptions.filepath, req.params.layer, req.params.object, req.body.group);
    // Create directory if doesn't already exists
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (typeof req.file !== 'undefined') {
        // Get the filename and convert to utf8 from latin1
        const fileName = path.join(dir, Buffer.from(req.file.originalname, 'latin1').toString('utf8'));
        // Write the file to disc
        fs.writeFileSync(fileName, req.file.buffer);
        // Create response object to send back after successful saved
        const retval = {
            "addAttachmentResult": {
                "objectId": getUuid(`${req.body.group}_${fileName}`, 5),
                "globalId": null,
                "success": true
            }
        }
        res.json(retval);
    } else {
        // Something went wrong with posting the file
        const retval = {
            "addAttachmentResult": {
                "objectId": null,
                "globalId": null,
                "success": false
            }
        }
         res.json(retval);
    }
 });

module.exports = attachmentRouter;
