import { useState } from "react";
import Modal from "./Modal";
import ThumbnailPicker from "./ThumbnailPicker";

export default function VideoFormModal({ video, suggestedNumber, onClose, onSubmit }) {
  const isEdit = Boolean(video);
  const [videoNumber, setVideoNumber] = useState(
    video?.videoNumber ?? suggestedNumber ?? ""
  );
  const [driveLink, setDriveLink] = useState(video?.driveLink || "");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(video?.thumbnailUrl || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFileSelected = (file) => {
    setThumbnailFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (videoNumber === "" || !driveLink.trim() || (!isEdit && !thumbnailFile)) {
      setError("Video number, Drive link, and a thumbnail are all required.");
      return;
    }

    const formData = new FormData();
    formData.append("videoNumber", videoNumber);
    formData.append("driveLink", driveLink.trim());
    if (thumbnailFile) formData.append("thumbnail", thumbnailFile);

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const videoIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-brand-orange">
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 8-4 3 4 3V8Z" />
    </svg>
  );

  return (
    <Modal onClose={onClose} title={isEdit ? "Edit video" : "Add a new video"} icon={videoIcon}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ThumbnailPicker previewUrl={previewUrl} onFileSelected={handleFileSelected} />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Video number</label>
          <input
            type="number"
            value={videoNumber}
            onChange={(e) => setVideoNumber(e.target.value)}
            placeholder="e.g. 12"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Google Drive link</label>
          <input
            type="url"
            value={driveLink}
            onChange={(e) => setDriveLink(e.target.value)}
            placeholder="https://drive.google.com/..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-gradient-to-r from-brand-green to-brand-green-light px-4 py-2 text-sm font-semibold text-white shadow-md shadow-green-500/25 transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Add video"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
