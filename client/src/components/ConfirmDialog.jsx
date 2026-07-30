import { useState } from "react";
import Modal from "./Modal";

export default function ConfirmDialog({ title, message, confirmLabel = "Delete", onConfirm, onClose }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setSubmitting(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const trashIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-red-600">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2m-8 0 .6 12.1a2 2 0 0 0 2 1.9h5.8a2 2 0 0 0 2-1.9L18.5 7" />
    </svg>
  );

  return (
    <Modal onClose={onClose} title={title} icon={trashIcon}>
      <p className="text-sm text-gray-600">{message}</p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-500/25 transition hover:bg-red-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {submitting ? "Deleting..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
