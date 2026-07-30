import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    videoNumber: { type: Number, required: true },
    driveLink: { type: String, required: true, trim: true },
    thumbnailUrl: { type: String, required: true },
    paid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Video", videoSchema);
