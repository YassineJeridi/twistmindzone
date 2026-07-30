import express from "express";
import fs from "fs";
import path from "path";
import Video from "../models/Video.js";
import { requireAuth } from "../middleware/auth.js";
import { upload, uploadsDir } from "../middleware/upload.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

function removeThumbnailFile(thumbnailUrl) {
  if (!thumbnailUrl) return;
  const filename = path.basename(thumbnailUrl);
  const filePath = path.join(uploadsDir, filename);
  fs.unlink(filePath, () => {});
}

// GET /api/videos - public, list all videos (highest video number first)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const videos = await Video.find().sort({ videoNumber: -1 });
    res.json(videos);
  })
);

// POST /api/videos - protected, create a new video card
router.post(
  "/",
  requireAuth,
  upload.single("thumbnail"),
  asyncHandler(async (req, res) => {
    const { driveLink } = req.body;
    const videoNumber = Number(req.body.videoNumber);

    if (!driveLink || !req.file || !Number.isFinite(videoNumber)) {
      if (req.file) removeThumbnailFile(req.file.filename);
      return res.status(400).json({ message: "Video number, Drive link, and a thumbnail are all required." });
    }

    const video = await Video.create({
      videoNumber,
      driveLink,
      thumbnailUrl: `/uploads/${req.file.filename}`,
    });

    res.status(201).json(video);
  })
);

// PUT /api/videos/:id - protected, update details (and optionally replace thumbnail)
router.put(
  "/:id",
  requireAuth,
  upload.single("thumbnail"),
  asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params.id);
    if (!video) {
      if (req.file) removeThumbnailFile(req.file.filename);
      return res.status(404).json({ message: "Video not found." });
    }

    const { driveLink } = req.body;
    if (driveLink) video.driveLink = driveLink;

    if (req.body.videoNumber !== undefined) {
      const videoNumber = Number(req.body.videoNumber);
      if (!Number.isFinite(videoNumber)) {
        if (req.file) removeThumbnailFile(req.file.filename);
        return res.status(400).json({ message: "Video number must be a valid number." });
      }
      video.videoNumber = videoNumber;
    }

    if (req.file) {
      removeThumbnailFile(video.thumbnailUrl);
      video.thumbnailUrl = `/uploads/${req.file.filename}`;
    }

    await video.save();
    res.json(video);
  })
);

// PATCH /api/videos/:id/paid - protected, toggle paid status
router.patch(
  "/:id/paid",
  requireAuth,
  asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found." });

    video.paid = typeof req.body.paid === "boolean" ? req.body.paid : !video.paid;
    await video.save();
    res.json(video);
  })
);

// DELETE /api/videos/:id - protected
router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found." });

    removeThumbnailFile(video.thumbnailUrl);
    res.json({ message: "Video deleted." });
  })
);

export default router;
