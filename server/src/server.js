import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import videoRoutes from "./routes/videos.js";
import pdfRoutes from "./routes/pdfs.js";
import apiRoutes from "./routes/api.js";
import { uploadsDir } from "./middleware/upload.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/pdfs", pdfRoutes);
app.use("/api/v1", apiRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// If the client has been built (npm run build in /client), serve it here too,
// so the whole app can run as a single process with `npm start`.
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// Friendly error handling for bad uploads (wrong file type, too large, etc.)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes("image")) {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
