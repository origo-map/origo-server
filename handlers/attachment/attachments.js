var conf = require('../../conf/config');
var ex = require('express');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const getUuid = require('uuid-by-string');

let configOptions = {};

if (conf['attachment']) {
    configOptions = Object.assign({}, conf['attachment']);
}

/**
 * List all attachments belonging to this layer/collection and group
 *
 * @function
 * @name listAttachments
 * @kind function
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns {Promise<void>}
 */
function listAttachments(req, res, next) {
    const dir = path.join(configOptions.filepath, req.params.layer, req.params.object);
    let fileInfos = [];
    // Check directory for files
    if (!fs.existsSync(dir)) {
        // No files found return empty
        res.json({ "attachmentInfos": fileInfos });
    } else {
        const groups = fs.readdirSync(dir);
        groups.forEach(group => {
            const groupPath = path.join(dir, group);
            const fileNames = fs.readdirSync(groupPath);
            // Go through the files in directory
            fileNames.forEach(filename => {
                const filePath = path.join(groupPath, filename);
                const fileInfo = {
                "id": getUuid(`${group}_${filename}`, 5),  // Create a stable uuid for the file from the group and filename, uuid version 5
                "contentType": mime.lookup(filename),
                "size": fs.statSync(filePath).size,
                "name": filename,
                "group": group
                };
                fileInfos.push(fileInfo);
            });
        });
        res.json({ "attachmentInfos": fileInfos });
    }
}

/**
 * List all attachments belonging to this layer/collection
 *
 * @function
 * @name listAllAttachments
 * @kind function
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns {Promise<void>}
 */
function listAllAttachments(req, res, next) {
    const dir = path.join(configOptions.filepath, req.params.layer);
    let fileInfos = [];
    // Check directory for files
    if (!fs.existsSync(dir)) {
        // No files found return empty
        res.json({ "attachmentInfos": fileInfos });
    } else {
        const objects = fs.readdirSync(dir);
        objects.forEach(object => {
            const objectPath = path.join(dir, object);
            const groups = fs.readdirSync(objectPath);
            // Go through the files in directory
            groups.forEach(group => {
                const groupPath = path.join(dir, object, group);
                const files = fs.readdirSync(groupPath);
                files.forEach(filename => {
                    const filePath = path.join(groupPath, filename);
                    const fileInfo = {
                    "id": getUuid(`${group}_${filename}`, 5),  // Create a stable uuid for the file from the group and filename, uuid version 5
                    "contentType": mime.lookup(filename),
                    "size": fs.statSync(filePath).size,
                    "name": filename,
                    "group": group,
                    "object": object
                    };
                    fileInfos.push(fileInfo);
                });
            });
        });
        res.json({ "attachmentInfos": fileInfos });
    }
}

/**
 * Get the the document with id from a specific object and group
 *
 * @function
 * @name fetchDoc
 * @kind function
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns {Promise<void>}
 */
function fetchDoc(req, res, next) {
    const dir = path.join(configOptions.filepath, req.params.layer, req.params.object);
    const groups = fs.readdirSync(dir);
    groups.forEach(group => {
        const groupPath = path.join(dir, group);
        const fileNames = fs.readdirSync(groupPath);

        fileNames.forEach(filename => {
            if (getUuid(`${group}_${filename}`, 5) === req.params.id) {
                const filePath = path.join(dir, group, filename);
                 res.sendFile(filePath);
            }
        });
    });
}

/**
 * Delete a attachment files identified by uuid
 *
 * @function
 * @name deleteAttachment
 * @kind function
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns {void}
 */
function deleteAttachments(req, res, next) {
    const result = { "deleteAttachmentResults": [] };
    const idsToDelete = req.body.attachmentIds.split(',');
    const dir = path.join(configOptions.filepath, req.params.layer, req.params.object);

    if (fs.existsSync(dir)) {
        const groups = fs.readdirSync(dir);
        groups.forEach(group => {
            const fileNames = fs.readdirSync(path.join(dir, group));
            fileNames.forEach(filename => {
                if (idsToDelete.includes(getUuid(`${group}_${filename}`, 5))) {
                    const filePath = path.join(dir, group, filename);
                    fs.rm(filePath, { recursive: true }, (err) => {
                        if(err){
                            // File deletion failed
                            console.error(err.message);
                            return;
                        }
                        console.log("File deleted successfully");
                    });
                    result.deleteAttachmentResults.push({
                        "objectId": getUuid(`${group}_${filename}`, 5),  // Create a stable uuid for the file from the group and filename, uuid version 5
                        "globalId": null,
                        "success": true
                    });
                }
            });
        });
    }
    res.json(result);
}

/**
 * Delete all attachment files for a object
 *
 * @function
 * @name deleteAllAttachments
 * @kind function
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns {void}
 */
function deleteAllAttachments(req, res, next) {
    const result = { "deleteAllAttachmentsResults": [] };
    const dir = path.join(configOptions.filepath, req.params.layer, req.params.object);

    if (fs.existsSync(dir)) {
        const groups = fs.readdirSync(dir);
        groups.forEach(group => {
            const groupPath = path.join(dir, group);
            const fileNames = fs.readdirSync(groupPath);
            fileNames.forEach(filename => {
                const filePath = path.join(dir, group, filename);
                fs.rm(filePath, { recursive: true }, (err) => {
                    if(err){
                        // File deletion failed
                        console.error(err.message);
                        return;
                    }
                    console.log("File deleted successfully");
                })
                result.deleteAllAttachmentsResults.push({
                    "objectId": getUuid(`${group}_${filename}`, 5),  // Create a stable uuid for the file from the group and filename, uuid version 5
                    "globalId": null,
                    "success": true
                });
            });
            fs.rm(dir, { recursive: true }, (err) => {
                if (err) {
                    // Directory deletion failed
                    console.error(err.message);
                    return;
                }
                else {
                    console.log("Directory Deleted!");
                }
            });
        });
    }
    res.json(result);
}

module.exports = { listAttachments, fetchDoc, deleteAttachments, deleteAllAttachments, listAllAttachments };