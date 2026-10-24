import express from "express";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import Pdf from "../models/Pdf.js";
import Video from "../models/Video.js";
import { requireApiKey } from "../middleware/apiKey.js";
import { upload, uploadsDir } from "../middleware/upload.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

// External API (v1) for other Redix apps, e.g. the REDIX dashboard.
// Full read/write access to videos and PDFs. See server/API.md for usage.

const RESOURCES = {
  videos: {
    Model: Video,
    label: "Video",
    imageField: "thumbnail", // multipart field name
    urlField: "thumbnailUrl",
    fields: { videoNumber: "number", driveLink: "string", paid: "boolean" },
    sorts: {
      number: { videoNumber: -1 },
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      updated: { updatedAt: -1 },
    },
    defaultSort: "number",
  },
  pdfs: {
    Model: Pdf,
    label: "PDF",
    imageField: "image",
    urlField: "imageUrl",
    fields: { name: "string", puzzleCount: "number", paid: "boolean" },
    sorts: {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      updated: { updatedAt: -1 },
      name: { name: 1 },
    },
    defaultSort: "newest",
  },
};

// Sent back by the API, so a client may echo them in a PATCH body; ignored.
const READ_ONLY_FIELDS = ["_id", "id", "__v", "createdAt", "updatedAt", "thumbnailUrl", "imageUrl",
  "thumbnailAbsoluteUrl", "imageAbsoluteUrl"];
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function serialize(doc, resource) {
  const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;
  // PUBLIC_URL overrides CLIENT_ORIGIN if the API is ever served elsewhere.
  const origin = process.env.PUBLIC_URL || process.env.CLIENT_ORIGIN || "";
  const absoluteKey = resource.urlField.replace(/Url$/, "AbsoluteUrl");
  return { ...obj, [absoluteKey]: `${origin}${obj[resource.urlField]}` };
}

function removeUploadedFile(url) {
  if (!url) return;
  fs.unlink(path.join(uploadsDir, path.basename(url)), () => {});
}

// Turns a JSON or multipart body into validated field updates. Mongoose's own
// validation (required, ...) runs later on save().
function parseFields(body, resource) {
  const editable = Object.keys(resource.fields);
  const unknown = Object.keys(body).filter(
    (key) => !editable.includes(key) && !READ_ONLY_FIELDS.includes(key)
  );
  if (unknown.length) {
    throw new ApiError(400, `Unknown field(s): ${unknown.join(", ")}`, { editableFields: editable });
  }

  const updates = {};
  for (const [field, type] of Object.entries(resource.fields)) {
    if (!(field in body)) continue;
    const value = body[field];

    if (type === "string") {
      if (value === null || value === "") updates[field] = undefined;
      else if (typeof value === "string" || typeof value === "number") updates[field] = String(value).trim();
      else throw new ApiError(400, `"${field}" must be a string.`);
    } else if (type === "number") {
      const num = value === null || value === "" ? NaN : Number(value);
      if (!Number.isFinite(num)) throw new ApiError(400, `"${field}" must be a number.`);
      updates[field] = num;
    } else if (type === "boolean") {
      if (value === true || value === "true") updates[field] = true;
      else if (value === false || value === "false") updates[field] = false;
      else throw new ApiError(400, `"${field}" must be true or false.`);
    }
  }
  return updates;
}

function buildRouter(resource) {
  const { Model, label, imageField, urlField, sorts, defaultSort } = resource;
  const router = express.Router();

  // Removes the just-uploaded file if the handler fails, so bad requests
  // never leave orphaned images on disk.
  const withUploadCleanup = (fn) =>
    asyncHandler(async (req, res, next) => {
      try {
        await fn(req, res, next);
      } catch (err) {
        if (req.file) removeUploadedFile(req.file.filename);
        throw err;
      }
    });

  async function findOr404(id) {
    const doc = mongoose.isValidObjectId(id) ? await Model.findById(id) : null;
    if (!doc) throw new ApiError(404, `${label} not found.`);
    return doc;
  }

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const filter = {};
      if (req.query.paid !== undefined) {
        if (!["true", "false"].includes(req.query.paid)) {
          throw new ApiError(400, '"paid" must be true or false.');
        }
        filter.paid = req.query.paid === "true";
      }
      if (req.query.updatedSince) {
        const since = new Date(req.query.updatedSince);
        if (Number.isNaN(since.getTime())) {
          throw new ApiError(400, '"updatedSince" must be a valid date (e.g. 2026-10-01 or an ISO timestamp).');
        }
        filter.updatedAt = { $gt: since };
      }

      const sortKey = req.query.sort || defaultSort;
      const sort = sorts[sortKey];
      if (!sort) throw new ApiError(400, `"sort" must be one of: ${Object.keys(sorts).join(", ")}.`);

      const total = await Model.countDocuments(filter);

      if (req.query.limit === "all") {
        const docs = await Model.find(filter).sort(sort).lean();
        return res.json({ data: docs.map((d) => serialize(d, resource)), total, page: 1, limit: total, totalPages: 1 });
      }

      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const docs = await Model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean();

      res.json({
        data: docs.map((d) => serialize(d, resource)),
        total,
        page,
        limit,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      });
    })
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      res.json(serialize(await findOr404(req.params.id), resource));
    })
  );

  // multipart/form-data; the image is required because the model requires it.
  router.post(
    "/",
    upload.single(imageField),
    withUploadCleanup(async (req, res) => {
      const fields = parseFields(req.body || {}, resource);
      if (!req.file) {
        throw new ApiError(400, `An image is required in the "${imageField}" form field.`);
      }
      const doc = await Model.create({ ...fields, [urlField]: `/uploads/${req.file.filename}` });
      res.status(201).json(serialize(doc, resource));
    })
  );

  // JSON, or multipart/form-data to also replace the image.
  router.patch(
    "/:id",
    upload.single(imageField),
    withUploadCleanup(async (req, res) => {
      const doc = await findOr404(req.params.id);
      const updates = parseFields(req.body || {}, resource);
      if (!Object.keys(updates).length && !req.file) {
        throw new ApiError(400, "Nothing to update.", { editableFields: Object.keys(resource.fields) });
      }

      const oldUrl = doc[urlField];
      doc.set(updates);
      if (req.file) doc[urlField] = `/uploads/${req.file.filename}`;
      await doc.save();
      if (req.file) removeUploadedFile(oldUrl);

      res.json(serialize(doc, resource));
    })
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const doc = await findOr404(req.params.id);
      await doc.deleteOne();
      removeUploadedFile(doc[urlField]);
      res.json({ ok: true, id: doc._id });
    })
  );

  return router;
}

async function counts(Model) {
  const [total, paid] = await Promise.all([Model.countDocuments(), Model.countDocuments({ paid: true })]);
  return { total, paid, unpaid: total - paid };
}

const router = express.Router();
router.use(requireApiKey);

router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const [videos, pdfs] = await Promise.all([counts(Video), counts(Pdf)]);
    res.json({ videos, pdfs });
  })
);

for (const [name, resource] of Object.entries(RESOURCES)) {
  router.use(`/${name}`, buildRouter(resource));
}

router.use((req, res) => {
  res.status(404).json({ message: "Not found." });
});

// Bad-input and validation errors become 400s with details; anything else
// (including multer errors) falls through to the app-wide handler.
router.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, ...(err.details && { details: err.details }) });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.fromEntries(Object.entries(err.errors).map(([field, e]) => [field, e.message]));
    return res.status(400).json({ message: "Validation failed.", details });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: `Invalid value for "${err.path}".` });
  }
  next(err);
});

export default router;
