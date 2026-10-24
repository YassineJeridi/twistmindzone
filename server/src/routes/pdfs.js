import express from "express";
import fs from "fs";
import path from "path";
import Pdf from "../models/Pdf.js";
import { requireAuth } from "../middleware/auth.js";
import { upload, uploadsDir } from "../middleware/upload.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

function removeImageFile(imageUrl) {
  if (!imageUrl) return;
  const filename = path.basename(imageUrl);
  const filePath = path.join(uploadsDir, filename);
  fs.unlink(filePath, () => {});
}

// GET /api/pdfs - public, list all PDFs (newest first)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const pdfs = await Pdf.find().sort({ createdAt: -1 });
    res.json(pdfs);
  })
);

// POST /api/pdfs - protected, create a new PDF card
router.post(
  "/",
  requireAuth,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    const puzzleCount = Number(req.body.puzzleCount);

    if (!name?.trim() || !req.file || !Number.isFinite(puzzleCount)) {
      if (req.file) removeImageFile(req.file.filename);
      return res.status(400).json({ message: "Name, number of puzzles, and an image are all required." });
    }

    const pdf = await Pdf.create({
      name: name.trim(),
      puzzleCount,
      imageUrl: `/uploads/${req.file.filename}`,
    });

    res.status(201).json(pdf);
  })
);

// PUT /api/pdfs/:id - protected, update details (and optionally replace image)
router.put(
  "/:id",
  requireAuth,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) {
      if (req.file) removeImageFile(req.file.filename);
      return res.status(404).json({ message: "PDF not found." });
    }

    const { name } = req.body;
    if (name) pdf.name = name.trim();

    if (req.body.puzzleCount !== undefined) {
      const puzzleCount = Number(req.body.puzzleCount);
      if (!Number.isFinite(puzzleCount)) {
        if (req.file) removeImageFile(req.file.filename);
        return res.status(400).json({ message: "Number of puzzles must be a valid number." });
      }
      pdf.puzzleCount = puzzleCount;
    }

    if (req.file) {
      removeImageFile(pdf.imageUrl);
      pdf.imageUrl = `/uploads/${req.file.filename}`;
    }

    await pdf.save();
    res.json(pdf);
  })
);

// PATCH /api/pdfs/:id/paid - protected, toggle paid status
router.patch(
  "/:id/paid",
  requireAuth,
  asyncHandler(async (req, res) => {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) return res.status(404).json({ message: "PDF not found." });

    pdf.paid = typeof req.body.paid === "boolean" ? req.body.paid : !pdf.paid;
    await pdf.save();
    res.json(pdf);
  })
);

// DELETE /api/pdfs/:id - protected
router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const pdf = await Pdf.findByIdAndDelete(req.params.id);
    if (!pdf) return res.status(404).json({ message: "PDF not found." });

    removeImageFile(pdf.imageUrl);
    res.json({ message: "PDF deleted." });
  })
);

export default router;
