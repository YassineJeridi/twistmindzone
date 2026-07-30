import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Modal from "./Modal";

export default function PasskeyModal() {
  const { passkeyModalOpen, closePasskeyModal, unlock } = useAuth();
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!passkeyModalOpen) return null;

  const handleClose = () => {
    setPasskey("");
    setError("");
    closePasskeyModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await unlock(passkey);
      setPasskey("");
    } catch (err) {
      setError(err.message || "Incorrect passkey.");
    } finally {
      setSubmitting(false);
    }
  };

  const keyIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-brand-blue">
      <circle cx="8" cy="15" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 12.5 20 3m0 0h-4m4 0v4m-8.5 2.5L15 6" />
    </svg>
  );

  return (
    <Modal onClose={handleClose} title="Enter passkey" icon={keyIcon}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">
          Adding, editing, deleting, or marking videos as paid requires the shared passkey.
        </p>
        <input
          type="password"
          autoFocus
          value={passkey}
          onChange={(e) => setPasskey(e.target.value)}
          placeholder="Passkey"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !passkey}
            className="rounded-full bg-gradient-to-r from-brand-blue to-brand-blue-light px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? "Checking..." : "Unlock"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
