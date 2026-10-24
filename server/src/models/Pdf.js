import mongoose from "mongoose";

const pdfSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    puzzleCount: { type: Number, required: true },
    paid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Pdf", pdfSchema);
