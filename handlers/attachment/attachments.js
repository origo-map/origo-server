var conf = require("../../conf/config");
var ex = require("express");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const getUuid = require("uuid-by-string");
const axios = require("axios").default;

let configOptions = {};

if (conf["attachment"]) {
  configOptions = Object.assign({}, conf["attachment"]);
}

// Upload limits. Override in config.js with attachment.maxFileSize (bytes),
// attachment.allowedExtensions and attachment.inlineExtensions (lists of file extensions without dot).
const DEFAULT_MAX_FILE_SIZE = 25 * 1024 * 1024;
const DEFAULT_ALLOWED_EXTENSIONS = [
  "jpg", "jpeg", "png", "gif", "webp", "heic", "bmp", "tif", "tiff",
  "pdf", "txt", "csv", "rtf",
  "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp",
  "msg", "eml", "dwg", "dxf", "zip",
];
// Shown in the browser when opened; everything else is sent as a download. Not SVG or HTML,
// since they can run scripts in the server's origin.
const DEFAULT_INLINE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];

const lowerList = (list, fallback) => (Array.isArray(list) ? list : fallback).map((ext) => String(ext).toLowerCase().replace(/^\./, ""));
const maxFileSize = Number(configOptions.maxFileSize) > 0 ? Number(configOptions.maxFileSize) : DEFAULT_MAX_FILE_SIZE;
const allowedExtensions = lowerList(configOptions.allowedExtensions, DEFAULT_ALLOWED_EXTENSIONS);
const inlineExtensions = lowerList(configOptions.inlineExtensions, DEFAULT_INLINE_EXTENSIONS);

const extensionOf = (filename) => path.extname(filename).slice(1).toLowerCase();
const isAllowedFile = (filename) => allowedExtensions.includes(extensionOf(filename));

function safeJoin(base, ...segments) {
  const resolvedBase = path.resolve(base);
  segments.forEach((seg) => {
    if (
      typeof seg !== "string" ||
      seg.length === 0 ||
      seg.indexOf("/") !== -1 ||
      seg.indexOf("\\") !== -1 ||
      seg === "." ||
      seg === ".."
    ) {
      throw new Error("Ogiltig sökvägskomponent");
    }
  });
  const target = path.resolve(resolvedBase, ...segments);
  if (target !== resolvedBase && target.indexOf(resolvedBase + path.sep) !== 0) {
    throw new Error("Sökväg utanför tillåten katalog");
  }
  return target;
}

/**
 * Resolve the directory for the request with safeJoin. Answers 400 and returns null when a
 * path segment from the request is invalid, so the handler can just return.
 */
function requestDir(res, ...segments) {
  try {
    return safeJoin(configOptions.filepath, ...segments);
  } catch (e) {
    res.status(400).json({ error: e.message });
    return null;
  }
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
  const dir = requestDir(res, req.params.layer, req.params.object);
  if (!dir) return;
  let fileInfos = [];
  // Check directory for files
  if (!fs.existsSync(dir)) {
    // No files found return empty
    res.json({ attachmentInfos: fileInfos });
  } else {
    const groups = fs.readdirSync(dir);
    groups.forEach((group) => {
      const groupPath = path.join(dir, group);
      const fileNames = fs.readdirSync(groupPath);
      // Go through the files in directory
      fileNames.forEach((filename) => {
        const filePath = path.join(groupPath, filename);
        const fileInfo = {
          id: getUuid(`${group}_${filename}`, 5), // Create a stable uuid for the file from the group and filename, uuid version 5
          contentType: mime.lookup(filename),
          size: fs.statSync(filePath).size,
          name: filename,
          group: group,
        };
        fileInfos.push(fileInfo);
      });
    });
    res.json({ attachmentInfos: fileInfos });
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
  const dir = requestDir(res, req.params.layer);
  if (!dir) return;
  let fileInfos = [];
  // Check directory for files
  if (!fs.existsSync(dir)) {
    // No files found return empty
    res.json({ attachmentInfos: fileInfos });
  } else {
    const objects = fs.readdirSync(dir);
    objects.forEach((object) => {
      const objectPath = path.join(dir, object);
      const groups = fs.readdirSync(objectPath);
      // Go through the files in directory
      groups.forEach((group) => {
        const groupPath = path.join(dir, object, group);
        const files = fs.readdirSync(groupPath);
        files.forEach((filename) => {
          const filePath = path.join(groupPath, filename);
          const fileInfo = {
            id: getUuid(`${group}_${filename}`, 5), // Create a stable uuid for the file from the group and filename, uuid version 5
            contentType: mime.lookup(filename),
            size: fs.statSync(filePath).size,
            name: filename,
            group: group,
            object: object,
          };
          fileInfos.push(fileInfo);
        });
      });
    });
    res.json({ attachmentInfos: fileInfos });
  }
}

/**
 * Get the document with id from a specific object and group
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
  const dir = requestDir(res, req.params.layer, req.params.object);
  if (!dir) return;
  if (fs.existsSync(dir)) {
    // Group and file names come from the directory listing, not from the request.
    for (const group of fs.readdirSync(dir)) {
      const groupPath = path.join(dir, group);
      const filename = fs.readdirSync(groupPath).find((name) => getUuid(`${group}_${name}`, 5) === req.params.id);
      if (filename) {
        // Only safe images open in the browser; the rest is a download. nosniff and the sandbox
        // stop an uploaded file from running as a page in the server's origin.
        const disposition = inlineExtensions.includes(extensionOf(filename)) ? "inline" : "attachment";
        res.set({
          "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(filename)}`,
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'; sandbox",
        });
        res.sendFile(path.join(groupPath, filename));
        return;
      }
    }
  }
  res.status(404).send("Not found");
}

/**
 * Delete an attachment file identified by uuid
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
  const result = { deleteAttachmentResults: [] };
  const idsToDelete = req.body.attachmentIds.split(",");
  const dir = requestDir(res, req.params.layer, req.params.object);
  if (!dir) return;

  if (fs.existsSync(dir)) {
    const groups = fs.readdirSync(dir);
    groups.forEach((group) => {
      const fileNames = fs.readdirSync(path.join(dir, group));
      fileNames.forEach((filename) => {
        if (idsToDelete.includes(getUuid(`${group}_${filename}`, 5))) {
          const filePath = path.join(dir, group, filename);
          fs.rm(filePath, { recursive: true }, (err) => {
            if (err) {
              // File deletion failed
              console.error(err.message);
              return;
            }
            console.log("File deleted successfully");
          });
          result.deleteAttachmentResults.push({
            objectId: getUuid(`${group}_${filename}`, 5), // Create a stable uuid for the file from the group and filename, uuid version 5
            globalId: null,
            success: true,
          });
        }
      });
    });
  }
  res.json(result);
}

/**
 * Delete all attachment files for an object
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
  const result = { deleteAllAttachmentsResults: [] };
  const dir = requestDir(res, req.params.layer, req.params.object);
  if (!dir) return;

  if (fs.existsSync(dir)) {
    const groups = fs.readdirSync(dir);
    groups.forEach((group) => {
      const groupPath = path.join(dir, group);
      const fileNames = fs.readdirSync(groupPath);
      fileNames.forEach((filename) => {
        const filePath = path.join(dir, group, filename);
        fs.rm(filePath, { recursive: true }, (err) => {
          if (err) {
            // File deletion failed
            console.error(err.message);
            return;
          }
          console.log("File deleted successfully");
        });
        result.deleteAllAttachmentsResults.push({
          objectId: getUuid(`${group}_${filename}`, 5), // Create a stable uuid for the file from the group and filename, uuid version 5
          globalId: null,
          success: true,
        });
      });
      fs.rm(dir, { recursive: true }, (err) => {
        if (err) {
          // Directory deletion failed
          console.error(err.message);
          return;
        } else {
          console.log("Directory Deleted!");
        }
      });
    });
  }
  res.json(result);
}

module.exports = {
  listAttachments,
  fetchDoc,
  deleteAttachments,
  deleteAllAttachments,
  listAllAttachments,
  safeJoin,
  isAllowedFile,
  maxFileSize,
};
