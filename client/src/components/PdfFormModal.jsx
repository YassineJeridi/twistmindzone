import { useState } from "react";
import Modal from "./Modal";
import ThumbnailPicker from "./ThumbnailPicker";

export default function PdfFormModal({ pdf, onClose, onSubmit }) {
  const isEdit = Boolean(pdf);
  const [name, setName] = useState(pdf?.name || "");
  const [puzzleCount, setPuzzleCount] = useState(pdf?.puzzleCount ?? "");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(pdf?.imageUrl || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFileSelected = (file) => {
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || puzzleCount === "" || (!isEdit && !imageFile)) {
      setError("Name, number of puzzles, and an image are all required.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("puzzleCount", puzzleCount);
    if (imageFile) formData.append("image", imageFile);

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const pdfIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-brand-orange">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
    </svg>
  );

  return (
    <Modal onClose={onClose} title={isEdit ? "Edit PDF" : "Add a new PDF"} icon={pdfIcon}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ThumbnailPicker previewUrl={previewUrl} onFileSelected={handleFileSelected} />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Animal Puzzles Vol. 1"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Number of puzzles</label>
          <input
            type="number"
            min="0"
            value={puzzleCount}
            onChange={(e) => setPuzzleCount(e.target.value)}
            placeholder="e.g. 20"
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
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Add PDF"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
